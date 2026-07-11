import { expect, test } from "@playwright/test";

/**
 * Deckt den Kern-Workflow aus ARCHITECTURE.md ab: Kunde anlegen -> Angebot
 * mit Preisengine erstellen -> PDF-Download. Laeuft gegen den
 * Platzhalter-Demo-Tenant (server/tenant-context.ts), der von jedem
 * Request geteilt wird — daher `serial`, eindeutige Testdaten (Zeitstempel
 * im Namen) und Aggregat-Summen werden nur auf Plausibilitaet geprueft
 * (nicht auf exakte Werte), da der Demo-Tenant ueber die Zeit eigene
 * Preisregeln ansammeln kann, die die Gesamtsumme beeinflussen.
 */
test.describe.serial("Kernworkflow: Kunde -> Angebot -> PDF", () => {
  const runId = Date.now();
  const customerName = `E2E Kunde ${runId}`;
  let customerId = "";
  let offerId = "";

  test("Kunde anlegen", async ({ page }) => {
    await page.goto("/customers/new");
    await page.getByLabel("Name *").fill(customerName);
    await page.getByLabel("E-Mail").fill(`e2e-${runId}@example.com`);
    await page.getByRole("button", { name: "Kunde speichern" }).click();

    await page.waitForURL(/\/customers\/[0-9a-f-]+$/);
    customerId = page.url().split("/customers/")[1];

    await expect(
      page.getByRole("heading", { name: customerName }),
    ).toBeVisible();
  });

  test("Angebot mit Preisengine erstellen", async ({ page }) => {
    test.skip(!customerId, "Kunde wurde im vorherigen Test nicht angelegt.");

    await page.goto(`/offers/new?customerId=${customerId}`);

    const descriptionInput = page.getByPlaceholder(
      "Beschreibung (z. B. Wandsteckdose montieren)",
    );
    await descriptionInput.fill("E2E Testposition");

    const [mengeInput, , preisInput] = await page
      .locator("input[type='number']")
      .all();
    await mengeInput.fill("2");
    await preisInput.fill("100");

    // Live-Vorschau im Formular rechnet ohne Preisregeln -> exakt pruefbar.
    await expect(page.getByText("200,00")).toBeVisible();

    await page.getByRole("button", { name: "Angebot speichern" }).click();

    await page.waitForURL(/\/offers\/[0-9a-f-]+$/);
    offerId = page.url().split("/offers/")[1];

    await expect(page.getByText("E2E Testposition")).toBeVisible();
    await expect(page.getByText("2 Stk × 100,00 €")).toBeVisible();

    const grossText = await page
      .getByText("Gesamt")
      .locator("..")
      .getByText(/€/)
      .last()
      .textContent();
    const gross = parseFloat(
      (grossText ?? "0").replace(/[^\d,]/g, "").replace(",", "."),
    );
    // Mindestens Netto-Positionssumme (200) + gesetzliche MwSt., unabhaengig
    // von eventuell konfigurierten Preisregeln (Rabatte/Zuschlaege).
    expect(gross).toBeGreaterThanOrEqual(200);
  });

  test("PDF-Download liefert ein PDF", async ({ request }) => {
    test.skip(!offerId, "Angebot wurde im vorherigen Test nicht angelegt.");

    const response = await request.get(`/offers/${offerId}/pdf`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/pdf");

    const body = await response.body();
    expect(body.byteLength).toBeGreaterThan(0);
    expect(body.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
