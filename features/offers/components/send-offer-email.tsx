"use client";

import { Mail } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { sendOfferEmailAction } from "../actions";

export function SendOfferEmail({
  offerId,
  customerEmail,
}: {
  offerId: string;
  customerEmail: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!customerEmail) {
    return (
      <p className="text-muted-foreground text-xs">
        Für diesen Kunden ist keine E-Mail-Adresse hinterlegt.
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Mail /> Per E-Mail senden
      </Button>
    );
  }

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const result = await sendOfferEmailAction(offerId, message);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-4">
      <p className="text-sm">
        Wird an <strong>{customerEmail}</strong> gesendet, inkl. PDF-Anhang.
      </p>
      <Textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Persönliche Nachricht (optional)"
        rows={3}
      />
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={isPending} onClick={handleSend}>
          {isPending ? "Sende …" : "Jetzt senden"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => setOpen(false)}
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
