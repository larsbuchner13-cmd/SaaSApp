import { Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteOfferButton } from "@/features/offers/components/delete-offer-button";
import { OfferStatusBadge } from "@/features/offers/components/offer-status-badge";
import { getOfferById } from "@/repositories/offers";
import { getTenantContext } from "@/server/tenant-context";

export const dynamic = "force-dynamic";

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { companyId } = await getTenantContext();
  const offer = await getOfferById(companyId, id);

  if (!offer) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {offer.offerNumber}
          </h1>
          <p className="text-muted-foreground text-sm">{offer.customer.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <OfferStatusBadge status={offer.status} />
          {offer.status === "draft" && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Angebot bearbeiten"
            >
              <Link href={`/offers/${offer.id}/edit`}>
                <Pencil />
              </Link>
            </Button>
          )}
          <DeleteOfferButton offerId={offer.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Positionen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {offer.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <p>{item.description}</p>
                <p className="text-muted-foreground">
                  {item.quantity} {item.unit} ×{" "}
                  {currencyFormatter.format(Number(item.unitPrice))}
                </p>
              </div>
              <p className="font-medium">
                {currencyFormatter.format(
                  Number(item.quantity) * Number(item.unitPrice),
                )}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Netto</span>
            <span>{currencyFormatter.format(Number(offer.totalNet))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              MwSt. ({offer.vatRate}%)
            </span>
            <span>
              {currencyFormatter.format(
                Number(offer.totalGross) - Number(offer.totalNet),
              )}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Gesamt</span>
            <span>{currencyFormatter.format(Number(offer.totalGross))}</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
