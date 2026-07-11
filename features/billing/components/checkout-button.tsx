"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { Plan } from "@/config/plans";

import {
  createCheckoutSessionAction,
  type BillingActionState,
} from "../actions";

const initialState: BillingActionState = undefined;

export function CheckoutButton({ plan, label }: { plan: Plan; label: string }) {
  const [state, formAction, isPending] = useActionState(
    createCheckoutSessionAction.bind(null, plan),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Button type="submit" size="sm" disabled={isPending} className="w-full">
        {isPending ? "Weiterleiten …" : label}
      </Button>
      {state?.error && (
        <p className="text-destructive text-xs">{state.error}</p>
      )}
    </form>
  );
}
