import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listCustomers } from "@/repositories/customers";
import { listOffers } from "@/repositories/offers";
import { getTenantContext } from "@/server/tenant-context";

export const dynamic = "force-dynamic";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const { companyId } = await getTenantContext();
  const [customers, offers] = await Promise.all([
    listCustomers(companyId),
    listOffers(companyId),
  ]);

  const now = Date.now();
  const createdToday = offers.filter(
    (offer) => now - offer.createdAt.getTime() < ONE_DAY_MS,
  ).length;
  const createdThisWeek = offers.filter(
    (offer) => now - offer.createdAt.getTime() < 7 * ONE_DAY_MS,
  ).length;
  const openOffers = offers.filter((offer) => offer.status === "sent").length;

  const stats: Array<{ label: string; value: string; hint: string }> = [
    { label: "Heute", value: String(createdToday), hint: "Angebote erstellt" },
    {
      label: "Neue Angebote",
      value: String(createdThisWeek),
      hint: "diese Woche",
    },
    {
      label: "Offene Angebote",
      value: String(openOffers),
      hint: "warten auf Antwort",
    },
    { label: "Kunden", value: String(customers.length), hint: "insgesamt" },
  ];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
