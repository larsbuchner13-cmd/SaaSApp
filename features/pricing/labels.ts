import type { PricingRuleType, PricingRuleValueType } from "@/db/schema";

export const pricingRuleTypeLabels: Record<PricingRuleType, string> = {
  discount: "Rabatt",
  surcharge: "Zuschlag",
  travel: "Anfahrt",
  disposal: "Entsorgung",
  overhead: "Gemeinkosten",
  margin: "Gewinnaufschlag",
};

export const pricingRuleValueTypeLabels: Record<PricingRuleValueType, string> =
  {
    percentage: "Prozent (%)",
    fixed: "Festbetrag (€)",
  };
