import { Badge } from "@/components/ui/badge";
import type { OfferStatus } from "@/db/schema";

const labels: Record<OfferStatus, string> = {
  draft: "Entwurf",
  sent: "Versendet",
  accepted: "Angenommen",
  rejected: "Abgelehnt",
  expired: "Abgelaufen",
};

const variants: Record<
  OfferStatus,
  "secondary" | "default" | "destructive" | "outline"
> = {
  draft: "secondary",
  sent: "default",
  accepted: "default",
  rejected: "destructive",
  expired: "outline",
};

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
