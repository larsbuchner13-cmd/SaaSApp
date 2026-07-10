import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CustomerList } from "@/features/customers/components/customer-list";
import { listCustomers } from "@/repositories/customers";
import { getTenantContext } from "@/server/tenant-context";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { companyId } = await getTenantContext();
  const customers = await listCustomers(companyId);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Kunden</h1>
        <Button asChild size="lg">
          <Link href="/customers/new">
            <Plus /> Neuer Kunde
          </Link>
        </Button>
      </div>

      <CustomerList customers={customers} />
    </main>
  );
}
