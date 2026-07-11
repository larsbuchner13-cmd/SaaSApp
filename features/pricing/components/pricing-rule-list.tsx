import { Card, CardContent } from "@/components/ui/card";
import type { PricingRuleType, PricingRuleValueType } from "@/db/schema";

import { DeletePricingRuleButton } from "./delete-pricing-rule-button";
import { pricingRuleTypeLabels } from "../labels";

export type PricingRuleListItem = {
  id: string;
  type: PricingRuleType;
  label: string;
  value: string;
  valueType: PricingRuleValueType;
};

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

function formatValue(rule: PricingRuleListItem): string {
  return rule.valueType === "percentage"
    ? `${Number(rule.value)} %`
    : currencyFormatter.format(Number(rule.value));
}

export function PricingRuleList({ rules }: { rules: PricingRuleListItem[] }) {
  if (rules.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Noch keine Preisregeln angelegt. Ohne Regeln wird jedes Angebot als
        reine Positionssumme zzgl. MwSt. berechnet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rules.map((rule) => (
        <Card key={rule.id}>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">{rule.label}</p>
              <p className="text-muted-foreground text-sm">
                {pricingRuleTypeLabels[rule.type]} · {formatValue(rule)}
              </p>
            </div>
            <DeletePricingRuleButton ruleId={rule.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
