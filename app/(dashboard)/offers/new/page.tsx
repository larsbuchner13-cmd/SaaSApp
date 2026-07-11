import { OfferForm } from "@/features/offers/components/offer-form";
import { listCustomers } from "@/repositories/customers";
import { getTenantContext } from "@/server/tenant-context";

export const dynamic = "force-dynamic";

export default async function NewOfferPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const { companyId } = await getTenantContext();
  const customers = await listCustomers(companyId);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Neues Angebot</h1>

      {customers.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Du brauchst zuerst einen Kunden, bevor du ein Angebot erstellen
          kannst.
        </p>
      ) : (
        <OfferForm customers={customers} defaultCustomerId={customerId} />
      )}
    </main>
  );
}
