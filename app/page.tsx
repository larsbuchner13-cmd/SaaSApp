import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Angebote in Minuten statt Stunden
      </h1>
      <p className="text-muted-foreground max-w-md text-base">
        Die KI-gestützte Angebotserstellung für Handwerksbetriebe. Diktieren,
        prüfen, versenden.
      </p>
      <Button size="lg" asChild>
        <Link href="/dashboard">Zum Dashboard</Link>
      </Button>
    </main>
  );
}
