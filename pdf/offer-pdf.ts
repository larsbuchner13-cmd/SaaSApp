import "server-only";

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type Address = {
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
} | null;

export type OfferForPdf = {
  offerNumber: string;
  validUntil: string | null;
  notes: string | null;
  vatRate: string;
  totalNet: string;
  totalGross: string;
  createdAt: Date;
  customer: {
    name: string;
    contactPerson: string | null;
    address: Address;
  };
  items: Array<{
    description: string;
    quantity: string;
    unit: string;
    unitPrice: string;
  }>;
};

export type CompanyForPdf = {
  name: string;
  address: Address;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

function formatCurrency(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function formatAddress(address: Address): string {
  if (!address) return "";
  return [address.street, [address.zip, address.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
}

function wrapText(value: string, maxCharsPerLine: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Erzeugt ein A4-Angebots-PDF: Briefkopf, Kunde, Positionen, Summen,
 * Hinweise. Wird bei jedem Download frisch generiert (kein Blob-Storage
 * fuer Archivierung noch angebunden — folgt, sobald
 * BLOB_READ_WRITE_TOKEN vorliegt).
 */
export async function generateOfferPdf(params: {
  offer: OfferForPdf;
  company: CompanyForPdf;
}): Promise<Uint8Array> {
  const { offer, company } = params;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function text(value: string, x: number, size = 10, useBold = false) {
    page.drawText(value, {
      x,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  function newLine(dy: number) {
    y -= dy;
    if (y < 90) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function hr() {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.75, 0.75, 0.75),
    });
  }

  text(company.name, MARGIN, 16, true);
  newLine(20);
  const companyAddress = formatAddress(company.address);
  if (companyAddress) {
    text(companyAddress, MARGIN, 9);
    newLine(20);
  } else {
    newLine(6);
  }

  text(`Angebot ${offer.offerNumber}`, MARGIN, 14, true);
  newLine(18);
  text(`Datum: ${dateFormatter.format(offer.createdAt)}`, MARGIN, 9);
  if (offer.validUntil) {
    text(
      `Gültig bis: ${dateFormatter.format(new Date(offer.validUntil))}`,
      MARGIN + 220,
      9,
    );
  }
  newLine(28);

  text("Kunde", MARGIN, 10, true);
  newLine(14);
  text(offer.customer.name, MARGIN, 10);
  newLine(14);
  if (offer.customer.contactPerson) {
    text(offer.customer.contactPerson, MARGIN, 9);
    newLine(13);
  }
  const customerAddress = formatAddress(offer.customer.address);
  if (customerAddress) {
    text(customerAddress, MARGIN, 9);
    newLine(13);
  }
  newLine(20);

  const col = {
    desc: MARGIN,
    qty: MARGIN + 260,
    unit: MARGIN + 320,
    price: MARGIN + 370,
    total: MARGIN + 450,
  };

  text("Beschreibung", col.desc, 9, true);
  text("Menge", col.qty, 9, true);
  text("Einh.", col.unit, 9, true);
  text("Preis", col.price, 9, true);
  text("Gesamt", col.total, 9, true);
  newLine(6);
  hr();
  newLine(14);

  for (const item of offer.items) {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    text(
      item.description.length > 42
        ? `${item.description.slice(0, 41)}…`
        : item.description,
      col.desc,
      9,
    );
    text(String(quantity), col.qty, 9);
    text(item.unit, col.unit, 9);
    text(formatCurrency(unitPrice), col.price, 9);
    text(formatCurrency(quantity * unitPrice), col.total, 9);
    newLine(16);
  }

  newLine(6);
  hr();
  newLine(18);

  text("Netto", col.price, 10);
  text(formatCurrency(Number(offer.totalNet)), col.total, 10);
  newLine(15);
  text(`MwSt. (${offer.vatRate}%)`, col.price, 10);
  text(
    formatCurrency(Number(offer.totalGross) - Number(offer.totalNet)),
    col.total,
    10,
  );
  newLine(15);
  text("Gesamt", col.price, 11, true);
  text(formatCurrency(Number(offer.totalGross)), col.total, 11, true);
  newLine(32);

  if (offer.notes) {
    text("Hinweise", MARGIN, 9, true);
    newLine(13);
    for (const noteLine of wrapText(offer.notes, 95)) {
      text(noteLine, MARGIN, 9);
      newLine(12);
    }
  }

  return doc.save();
}
