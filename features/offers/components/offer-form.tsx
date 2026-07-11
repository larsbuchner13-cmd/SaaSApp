"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateOfferTotals } from "@/services/pricing/calculate-offer-totals";

import {
  createOfferAction,
  updateOfferAction,
  type OfferActionState,
} from "../actions";
import type { OfferItemInput } from "../schemas";
import { AiItemSuggestions } from "./ai-item-suggestions";

const DEFAULT_VAT_RATE = 19;

const emptyItem: OfferItemInput = {
  description: "",
  quantity: 1,
  unit: "Stk",
  unitPrice: 0,
  source: "manual",
};

const initialState: OfferActionState = undefined;

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export type EditableOffer = {
  id: string;
  customerId: string;
  validUntil: string | null;
  items: Array<{
    description: string;
    quantity: string;
    unit: string;
    unitPrice: string;
  }>;
};

export function OfferForm({
  customers,
  defaultCustomerId,
  editOffer,
}: {
  customers: Array<{ id: string; name: string }>;
  defaultCustomerId?: string;
  editOffer?: EditableOffer;
}) {
  const action = editOffer
    ? updateOfferAction.bind(null, editOffer.id)
    : createOfferAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [customerId, setCustomerId] = useState(
    editOffer?.customerId ?? defaultCustomerId ?? customers[0]?.id ?? "",
  );
  const [validUntil, setValidUntil] = useState(editOffer?.validUntil ?? "");
  const [items, setItems] = useState<OfferItemInput[]>(
    editOffer
      ? editOffer.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitPrice: Number(item.unitPrice),
          source: "manual" as const,
        }))
      : [{ ...emptyItem }],
  );

  const totals = useMemo(
    () =>
      calculateOfferTotals(
        items.map((item) => ({
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
        })),
        { vatRate: DEFAULT_VAT_RATE },
      ),
    [items],
  );

  function updateItem(index: number, patch: Partial<OfferItemInput>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleItemsGenerated(newItems: OfferItemInput[]) {
    setItems((prev) => {
      const isOnlyEmptyStarter =
        prev.length === 1 && !prev[0].description && prev[0].unitPrice === 0;
      return isOnlyEmptyStarter ? newItems : [...prev, ...newItems];
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(items)}
        readOnly
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="customerId">Kunde *</Label>
        <select
          id="customerId"
          name="customerId"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          required
          className="border-input h-10 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="" disabled>
            Kunde auswählen …
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="validUntil">Gültig bis</Label>
        <Input
          id="validUntil"
          name="validUntil"
          type="date"
          value={validUntil}
          onChange={(event) => setValidUntil(event.target.value)}
        />
      </div>

      <AiItemSuggestions onItemsGenerated={handleItemsGenerated} />

      <div className="flex flex-col gap-3">
        <Label>Positionen *</Label>
        {items.map((item, index) => (
          <Card key={index}>
            <CardContent className="flex flex-col gap-3">
              {item.source === "ai" && (
                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Sparkles className="size-3" /> KI-Vorschlag
                </span>
              )}
              <Input
                placeholder="Beschreibung (z. B. Wandsteckdose montieren)"
                value={item.description}
                onChange={(event) =>
                  updateItem(index, { description: event.target.value })
                }
                required
              />
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs">Menge</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(index, {
                        quantity: Number(event.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs">
                    Einheit
                  </Label>
                  <Input
                    value={item.unit}
                    onChange={(event) =>
                      updateItem(index, { unit: event.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs">
                    Preis/Einheit
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(event) =>
                      updateItem(index, {
                        unitPrice: Number(event.target.value),
                      })
                    }
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Position entfernen"
                  disabled={items.length === 1}
                  onClick={() => removeItem(index)}
                >
                  <Trash2 />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="outline" onClick={addItem}>
          <Plus /> Position hinzufügen
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Netto</span>
            <span>{currencyFormatter.format(totals.totalNet)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              MwSt. ({DEFAULT_VAT_RATE}%)
            </span>
            <span>
              {currencyFormatter.format(totals.totalGross - totals.totalNet)}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Gesamt</span>
            <span>{currencyFormatter.format(totals.totalGross)}</span>
          </div>
        </CardContent>
      </Card>

      {state?.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" size="lg" disabled={isPending || !customerId}>
        {isPending
          ? "Speichern …"
          : editOffer
            ? "Änderungen speichern"
            : "Angebot speichern"}
      </Button>
    </form>
  );
}
