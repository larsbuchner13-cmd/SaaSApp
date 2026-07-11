"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { generateOfferItemsAction } from "../actions";
import type { OfferItemInput } from "../schemas";

export function AiItemSuggestions({
  onItemsGenerated,
}: {
  onItemsGenerated: (items: OfferItemInput[]) => void;
}) {
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateOfferItemsAction(description);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onItemsGenerated(
        result.items.map((item) => ({
          description: item.description,
          quantity: 1,
          unit: item.unit,
          unitPrice: 0,
          source: "ai" as const,
        })),
      );
      setDescription("");
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-dashed p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="text-muted-foreground size-4" />
        KI-Vorschlag
      </div>
      <p className="text-muted-foreground text-xs">
        Beschreibe kurz, was zu tun ist — die KI schlägt Positionen vor. Preise
        und Mengen prüfst du danach selbst.
      </p>
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="z. B. Steckdose in der Küche setzen, alte Leitung raus, neue Halogenlampe im Flur montieren"
        rows={2}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending || !description.trim()}
        onClick={handleGenerate}
      >
        {isPending ? "Generiere …" : "Vorschläge generieren"}
      </Button>
    </div>
  );
}
