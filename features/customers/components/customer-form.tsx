"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createCustomerAction, type CustomerActionState } from "../actions";

const initialState: CustomerActionState = undefined;

export function CustomerForm() {
  const [state, formAction, isPending] = useActionState(
    createCustomerAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" required autoFocus />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contactPerson">Ansprechpartner</Label>
        <Input id="contactPerson" name="contactPerson" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" name="phone" type="tel" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" name="email" type="email" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="street">Straße</Label>
        <Input id="street" name="street" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="zip">PLZ</Label>
          <Input id="zip" name="zip" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">Ort</Label>
          <Input id="city" name="city" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notizen</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      {state?.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Speichern …" : "Kunde speichern"}
      </Button>
    </form>
  );
}
