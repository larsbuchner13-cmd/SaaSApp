import type { PricingRuleType, PricingRuleValueType } from "@/db/schema";

export type OfferLineInput = {
  quantity: number;
  unitPrice: number;
};

export type PricingRuleInput = {
  type: PricingRuleType;
  value: number;
  valueType: PricingRuleValueType;
};

export type OfferTotals = {
  itemsSubtotal: number;
  totalNet: number;
  totalGross: number;
};

const SURCHARGE_TYPES: readonly PricingRuleType[] = [
  "surcharge",
  "travel",
  "disposal",
  "overhead",
  "margin",
];

/**
 * Deterministische Preisberechnung — die einzige Stelle, die aus
 * Positionen + Preisregeln (Rabatte, Zuschläge, Anfahrt, Entsorgung,
 * Gemeinkosten, Gewinnaufschlag) einen Angebotspreis macht. Die KI darf
 * diese Funktion niemals umgehen oder eigene Preise liefern (siehe
 * ARCHITECTURE.md, Abschnitt "Preisberechnung").
 */
export function calculateOfferTotals(
  items: OfferLineInput[],
  options: { vatRate: number; rules?: PricingRuleInput[] },
): OfferTotals {
  const itemsSubtotal = round2(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  );

  const rules = options.rules ?? [];
  let net = itemsSubtotal;

  for (const rule of rules.filter((r) => SURCHARGE_TYPES.includes(r.type))) {
    net += ruleAmount(rule, itemsSubtotal);
  }
  for (const rule of rules.filter((r) => r.type === "discount")) {
    net -= ruleAmount(rule, itemsSubtotal);
  }

  net = Math.max(0, round2(net));
  const totalGross = round2(net * (1 + options.vatRate / 100));

  return { itemsSubtotal, totalNet: net, totalGross };
}

function ruleAmount(rule: PricingRuleInput, base: number): number {
  return rule.valueType === "percentage"
    ? base * (rule.value / 100)
    : rule.value;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
