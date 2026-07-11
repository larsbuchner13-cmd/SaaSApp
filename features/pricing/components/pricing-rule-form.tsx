"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pricingRuleTypeValues, pricingRuleValueTypeValues } from "@/db/schema";

import {
  createPricingRuleAction,
  type PricingRuleActionState,
} from "../actions";
import { pricingRuleTypeLabels, pricingRuleValueTypeLabels } from "../labels";

const initialState: PricingRuleActionState = undefined;

export function PricingRuleForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createPricingRuleAction,
    initialState,
  );

  useEffect(() => {
    if (!isPending && !state?.error) {
      formRef.current?.reset();
    }
  }, [isPending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Art</Label>
          <select
            id="type"
            name="type"
            required
            className="border-input h-10 rounded-md border bg-transparent px-3 text-sm"
          >
            {pricingRuleTypeValues.map((type) => (
              <option key={type} value={type}>
                {pricingRuleTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="valueType">Berechnung</Label>
          <select
            id="valueType"
            name="valueType"
            required
            className="border-input h-10 rounded-md border bg-transparent px-3 text-sm"
          >
            {pricingRuleValueTypeValues.map((valueType) => (
              <option key={valueType} value={valueType}>
                {pricingRuleValueTypeLabels[valueType]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="label">Bezeichnung</Label>
        <Input
          id="label"
          name="label"
          placeholder="z. B. Anfahrt Innenstadt"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="value">Wert</Label>
        <Input
          id="value"
          name="value"
          type="number"
          min="0"
          step="0.01"
          required
        />
      </div>

      {state?.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Speichern …" : "Regel hinzufügen"}
      </Button>
    </form>
  );
}
