"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateOfferTotals } from "@/services/pricing/calculate-offer-totals";

import { createOfferAction, type OfferActionState } from "../actions";
import type { OfferItemInput } from "../schemas";

const DEFAULT_VAT_RATE = 19;

const emptyItem: OfferItemInput = {
  description: "",
  quantity: 1,
  unit: "Stk",
  unitPrice: 0,
};

const initialState: OfferActionState = undefined;

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function OfferForm({
  customers,
  defaultCustomerId,
}: {
  customers: Array<{ id: string; name: string }>;
  defaultCustomerId?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createOfferAction,
    initialState,
  );
  const [customerId, setCustomerId] = useState(
    defaultCustomerId ?? customers[0]?.id ?? "",
  );
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<OfferItemInput[]>([{ ...emptyItem }]);

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

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        formAction({ customerId, validUntil, items });
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="customerId">Kunde *</Label>
        <select
          id="customerId"
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
          type="date"
          value={validUntil}
          onChange={(event) => setValidUntil(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label>Positionen *</Label>
        {items.map((item, index) => (
          <Card key={index}>
            <CardContent className="flex flex-col gap-3">
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
        {isPending ? "Speichern …" : "Angebot speichern"}
      </Button>
    </form>
  );
}
