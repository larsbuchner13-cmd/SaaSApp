"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold tracking-tight">
        Etwas ist schiefgelaufen
      </h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Diese Seite konnte gerade nicht geladen werden. Bitte versuche es erneut
        — falls es weiterhin nicht klappt, sag uns kurz Bescheid.
      </p>
      <Button size="lg" onClick={reset}>
        Erneut versuchen
      </Button>
    </main>
  );
}
