"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  createCustomerAction,
  updateCustomerAction,
  type CustomerActionState,
} from "../actions";

const initialState: CustomerActionState = undefined;

export type EditableCustomer = {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  zip: string | null;
  city: string | null;
  notes: string | null;
};

export function CustomerForm({
  editCustomer,
}: {
  editCustomer?: EditableCustomer;
}) {
  const action = editCustomer
    ? updateCustomerAction.bind(null, editCustomer.id)
    : createCustomerAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={editCustomer?.name}
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contactPerson">Ansprechpartner</Label>
        <Input
          id="contactPerson"
          name="contactPerson"
          defaultValue={editCustomer?.contactPerson ?? undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={editCustomer?.phone ?? undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={editCustomer?.email ?? undefined}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="street">Straße</Label>
        <Input
          id="street"
          name="street"
          defaultValue={editCustomer?.street ?? undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="zip">PLZ</Label>
          <Input
            id="zip"
            name="zip"
            defaultValue={editCustomer?.zip ?? undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">Ort</Label>
          <Input
            id="city"
            name="city"
            defaultValue={editCustomer?.city ?? undefined}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notizen</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={editCustomer?.notes ?? undefined}
        />
      </div>

      {state?.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending
          ? "Speichern …"
          : editCustomer
            ? "Änderungen speichern"
            : "Kunde speichern"}
      </Button>
    </form>
  );
}
