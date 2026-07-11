import { ChevronRight, CreditCard, History, Percent } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";

const settingsLinks = [
  {
    href: "/settings/pricing",
    label: "Preisregeln",
    description: "Rabatte, Zuschläge, Anfahrt, Entsorgung, Gewinnaufschlag",
    icon: Percent,
  },
  {
    href: "/settings/billing",
    label: "Abrechnung",
    description: "Tarif, Nutzung und Zahlungsdaten verwalten",
    icon: CreditCard,
  },
  {
    href: "/settings/audit",
    label: "Audit-Log",
    description: "Wer hat wann was erstellt, geändert oder gelöscht",
    icon: History,
  },
];

export default function SettingsPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>

      <div className="flex flex-col gap-3">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:bg-accent/50 transition-colors">
              <CardContent className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <link.icon className="text-muted-foreground size-5" />
                  <div>
                    <p className="font-medium">{link.label}</p>
                    <p className="text-muted-foreground text-sm">
                      {link.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground size-4" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
