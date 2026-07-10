import { CustomerForm } from "@/features/customers/components/customer-form";

export default function NewCustomerPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Neuer Kunde</h1>
      <CustomerForm />
    </main>
  );
}
