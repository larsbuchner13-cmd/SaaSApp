import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OfferStatus } from "@/db/schema";

import { OfferStatusBadge } from "./offer-status-badge";

export type OfferListItem = {
  id: string;
  offerNumber: string;
  status: OfferStatus;
  totalGross: string;
  customer: { name: string };
};

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function OfferList({ offers }: { offers: OfferListItem[] }) {
  if (offers.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Noch keine Angebote erstellt.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {offers.map((offer) => (
        <Link key={offer.id} href={`/offers/${offer.id}`}>
          <Card className="hover:bg-accent/50 transition-colors">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>{offer.customer.name}</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {offer.offerNumber}
                </p>
              </div>
              <OfferStatusBadge status={offer.status} />
            </CardHeader>
            <CardContent className="text-sm font-medium">
              {currencyFormatter.format(Number(offer.totalGross))}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
