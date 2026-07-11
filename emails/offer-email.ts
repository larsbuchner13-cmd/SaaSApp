const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

export type OfferEmailParams = {
  offerNumber: string;
  customerName: string;
  companyName: string;
  totalGross: number;
  validUntil: string | null;
  message?: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

/**
 * Versionierte E-Mail-Vorlage fuer den Angebotsversand — bewusst als
 * einfaches HTML/Text-Template statt React-Email-Komponenten, um keine
 * zusaetzliche, hier nicht testbare Render-Pipeline einzufuehren. Kann
 * spaeter 1:1 durch React-Email ersetzt werden, ohne dass Aufrufer sich
 * aendern (liefert weiterhin nur { subject, html, text }).
 */
export function renderOfferEmail(params: OfferEmailParams): RenderedEmail {
  const total = currencyFormatter.format(params.totalGross);
  const validUntilLine = params.validUntil
    ? `Gültig bis ${dateFormatter.format(new Date(params.validUntil))}.`
    : "";
  const messageParagraph = params.message
    ? `<p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(params.message)}</p>`
    : "";

  const subject = `Ihr Angebot ${params.offerNumber} von ${params.companyName}`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#171717;">
      <p style="margin:0 0 16px;">Guten Tag ${escapeHtml(params.customerName)},</p>
      ${messageParagraph}
      <p style="margin:0 0 16px;">
        anbei erhalten Sie unser Angebot <strong>${escapeHtml(params.offerNumber)}</strong>
        über <strong>${total}</strong>. ${validUntilLine}
      </p>
      <p style="margin:0 0 24px;">Das PDF finden Sie im Anhang dieser E-Mail.</p>
      <p style="margin:0;">Mit freundlichen Grüßen<br />${escapeHtml(params.companyName)}</p>
    </div>
  `.trim();

  const text = [
    `Guten Tag ${params.customerName},`,
    params.message ?? "",
    `Anbei erhalten Sie unser Angebot ${params.offerNumber} über ${total}. ${validUntilLine}`,
    "Das PDF finden Sie im Anhang dieser E-Mail.",
    `Mit freundlichen Grüßen`,
    params.companyName,
  ]
    .filter(Boolean)
    .join("\n\n");

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
