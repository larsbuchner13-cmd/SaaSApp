import { FileText, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteCustomerButton } from "@/features/customers/components/delete-customer-button";
import { getCustomerById } from "@/repositories/customers";
import { getTenantContext } from "@/server/tenant-context";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
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

  const addressLine = customer.address
    ? [
        customer.address.street,
        [customer.address.zip, customer.address.city].filter(Boolean).join(" "),
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const hasContactInfo =
    customer.contactPerson || customer.phone || customer.email || addressLine;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {customer.name}
        </h1>
        <DeleteCustomerButton customerId={customer.id} />
      </div>

      <Button asChild size="lg">
        <Link href={`/offers/new?customerId=${customer.id}`}>
          <FileText /> Angebot erstellen
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {customer.contactPerson && <p>{customer.contactPerson}</p>}
          {customer.phone && (
            <p className="flex items-center gap-2">
              <Phone className="size-4" /> {customer.phone}
            </p>
          )}
          {customer.email && (
            <p className="flex items-center gap-2">
              <Mail className="size-4" /> {customer.email}
            </p>
          )}
          {addressLine && (
            <p className="flex items-center gap-2">
              <MapPin className="size-4" /> {addressLine}
            </p>
          )}
          {!hasContactInfo && (
            <p className="text-muted-foreground">
              Keine Kontaktdaten hinterlegt.
            </p>
          )}
        </CardContent>
      </Card>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notizen</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {customer.notes}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
