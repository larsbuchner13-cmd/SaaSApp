import { Card, CardContent } from "@/components/ui/card";

import { labelForAction } from "../labels";

export type AuditLogListItem = {
  id: string;
  action: string;
  createdAt: Date;
  actor: { name: string | null; email: string } | null;
};

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function AuditLogList({ entries }: { entries: AuditLogListItem[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Noch keine Aktivität aufgezeichnet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium">{labelForAction(entry.action)}</p>
              <p className="text-muted-foreground">
                {entry.actor?.name ?? entry.actor?.email ?? "Unbekannt"}
              </p>
            </div>
            <p className="text-muted-foreground">
              {dateFormatter.format(entry.createdAt)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
