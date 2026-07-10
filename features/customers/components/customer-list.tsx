"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type CustomerListItem = {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
};

export function CustomerList({ customers }: { customers: CustomerListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.contactPerson].some((value) =>
        value?.toLowerCase().includes(q),
      ),
    );
  }, [customers, query]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Kunde suchen …"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Kunden suchen"
      />

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {customers.length === 0
            ? "Noch keine Kunden angelegt."
            : "Keine Kunden gefunden."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle>{customer.name}</CardTitle>
                  {customer.contactPerson && (
                    <CardDescription>{customer.contactPerson}</CardDescription>
                  )}
                </CardHeader>
                {(customer.phone || customer.email) && (
                  <CardContent className="text-muted-foreground text-sm">
                    {[customer.phone, customer.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
