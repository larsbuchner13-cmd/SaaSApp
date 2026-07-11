export const auditActionLabels: Record<string, string> = {
  "customer.created": "Kunde angelegt",
  "customer.deleted": "Kunde gelöscht",
  "offer.created": "Angebot erstellt",
  "offer.updated": "Angebot bearbeitet",
  "offer.deleted": "Angebot gelöscht",
  "offer.pdf_generated": "Angebots-PDF heruntergeladen",
  "offer.sent": "Angebot per E-Mail versendet",
  "ai.offer_items_generated": "KI-Vorschlag für Positionen genutzt",
  "pricing_rule.created": "Preisregel angelegt",
  "pricing_rule.deleted": "Preisregel gelöscht",
};

export function labelForAction(action: string): string {
  return auditActionLabels[action] ?? action;
}
