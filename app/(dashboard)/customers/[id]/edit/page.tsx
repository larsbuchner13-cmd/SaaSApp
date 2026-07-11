import { notFound } from "next/navigation";

import { CustomerForm } from "@/features/customers/components/customer-form";
import { getCustomerById } from "@/repositories/customers";
import { getTenantContext } from "@/server/tenant-context";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { companyId } = await getTenantContext();
  const customer = await getCustomerById(companyId, id);

  if (!customer) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Kunde bearbeiten
      </h1>

      <CustomerForm
        editCustomer={{
          id: customer.id,
          name: customer.name,
          contactPerson: customer.contactPerson,
          email: customer.email,
          phone: customer.phone,
          street: customer.address?.street ?? null,
          zip: customer.address?.zip ?? null,
          city: customer.address?.city ?? null,
          notes: customer.notes,
        }}
      />
    </main>
  );
}
