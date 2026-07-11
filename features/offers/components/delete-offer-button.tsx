"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { deleteOfferAction } from "../actions";

export function DeleteOfferButton({ offerId }: { offerId: string }) {
  return (
    <form
      action={deleteOfferAction.bind(null, offerId)}
      onSubmit={(event) => {
        if (!window.confirm("Dieses Angebot wirklich löschen?")) {
          event.preventDefault();
        }
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="Angebot löschen"
      >
        <Trash2 />
      </Button>
    </form>
  );
}
