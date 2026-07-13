import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

/**
 * Deckt den Kern-Workflow aus ARCHITECTURE.md ab: Kunde anlegen -> Angebot
 * mit Preisengine erstellen -> PDF-Download. Braucht einen echten
 * Clerk-Test-User (per Sign-in-Token angemeldet, kein Passwort noetig —
 * siehe README.md, Abschnitt E2E-Tests), der Mitglied genau EINER
 * Organisation ist, damit Clerk deren `orgId` automatisch aktiv setzt
 * (unsere Middleware verlangt eine aktive Org fuer alle Dashboard-Routen).
 *
 * `serial`, da alle drei Tests denselben Tenant teilen — eindeutige
 * Testdaten (Zeitstempel im Namen) und Aggregat-Summen werden nur auf
 * Plausibilitaet geprueft (nicht auf exakte Werte), da der Tenant ueber die
 * Zeit eigene Preisregeln ansammeln kann, die die Gesamtsumme beeinflussen.
 */
const E2E_EMAIL = process.env.E2E_CLERK_USER_EMAIL;

test.describe.serial("Kernworkflow: Kunde -> Angebot -> PDF", () => {
  const runId = Date.now();
  const customerName = `E2E Kunde ${runId}`;
  let customerId = "";
  let offerId = "";

  test.beforeEach(async ({ page }) => {
    test.skip(
      !E2E_EMAIL,
      "E2E_CLERK_USER_EMAIL ist nicht gesetzt — siehe README.md, Abschnitt E2E-Tests.",
    );

    await setupClerkTestingToken({ page });
    await page.goto("/");
    await clerk.loaded({ page });
    await clerk.signIn({ page, emailAddress: E2E_EMAIL! });
  });

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

  test("PDF-Download liefert ein PDF", async ({ page }) => {
    test.skip(!offerId, "Angebot wurde im vorherigen Test nicht angelegt.");

    // page.request statt des eigenstaendigen `request`-Fixtures, damit die
    // Session-Cookies der angemeldeten Seite mitgeschickt werden (die
    // Route ist jetzt durch middleware.ts geschuetzt).
    const response = await page.request.get(`/offers/${offerId}/pdf`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/pdf");

    const body = await response.body();
    expect(body.byteLength).toBeGreaterThan(0);
    expect(body.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
