import Link from "next/link";
import { notFound } from "next/navigation";

import { OfferForm } from "@/features/offers/components/offer-form";
import { listCustomers } from "@/repositories/customers";
import { getOfferById } from "@/repositories/offers";
import { getTenantContext } from "@/server/tenant-context";

export const dynamic = "force-dynamic";

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { companyId } = await getTenantContext();
  const [offer, customers] = await Promise.all([
    getOfferById(companyId, id),
    listCustomers(companyId),
  ]);

  if (!offer) {
    notFound();
  }

  if (offer.status !== "draft") {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Nicht bearbeitbar
        </h1>
        <p className="text-muted-foreground text-sm">
          Nur Angebote im Entwurf können bearbeitet werden.
        </p>
        <Link
          href={`/offers/${offer.id}`}
          className="text-primary text-sm underline"
        >
          Zurück zum Angebot
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Angebot bearbeiten
      </h1>

      <OfferForm
        customers={customers}
        editOffer={{
          id: offer.id,
          customerId: offer.customerId,
          validUntil: offer.validUntil,
          items: offer.items
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
            })),
        }}
      />
    </main>
  );
}
