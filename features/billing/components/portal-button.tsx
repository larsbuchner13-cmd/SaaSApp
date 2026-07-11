"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { createPortalSessionAction, type BillingActionState } from "../actions";

const initialState: BillingActionState = undefined;

export function PortalButton() {
  const [state, formAction, isPending] = useActionState(
    createPortalSessionAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Öffne …" : "Zum Kundenportal"}
      </Button>
      {state?.error && (
        <p className="text-destructive text-xs">{state.error}</p>
      )}
    </form>
  );
}
