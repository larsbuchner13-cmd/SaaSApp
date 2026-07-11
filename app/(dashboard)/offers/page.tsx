import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OfferList } from "@/features/offers/components/offer-list";
import { listOffers } from "@/repositories/offers";
import { getTenantContext } from "@/server/tenant-context";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const { companyId } = await getTenantContext();
  const offers = await listOffers(companyId);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Angebote</h1>
        <Button asChild size="lg">
          <Link href="/offers/new">
            <Plus /> Neues Angebot
          </Link>
        </Button>
      </div>

      <OfferList offers={offers} />
    </main>
  );
}
