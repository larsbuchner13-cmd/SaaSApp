"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteCustomerAction } from "../actions";

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  return (
    <form
      action={deleteCustomerAction.bind(null, customerId)}
      onSubmit={(event) => {
        if (!window.confirm("Diesen Kunden wirklich löschen?")) {
          event.preventDefault();
        }
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="Kunde löschen"
      >
        <Trash2 />
      </Button>
    </form>
  );
}
