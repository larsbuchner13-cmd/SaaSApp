"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deletePricingRuleAction } from "../actions";

export function DeletePricingRuleButton({ ruleId }: { ruleId: string }) {
  return (
    <form action={deletePricingRuleAction.bind(null, ruleId)}>
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="Preisregel löschen"
      >
        <Trash2 />
      </Button>
    </form>
  );
}
