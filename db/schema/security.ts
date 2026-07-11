import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { idColumn } from "./_shared";
import { companies } from "./tenancy";

/**
 * Fixed-Window-Zaehler fuer Abuse-Rate-Limiting (nicht zu verwechseln mit den
 * monatlichen Plan-Limits in `usage_metrics`). `windowStart` ist auf die
 * Fenstergroesse abgerundet (z. B. Minutenanfang), sodass ein Insert je
 * Firma/Aktion/Fenster nur einmal existiert und atomar per
 * `onConflictDoUpdate` hochgezaehlt werden kann.
 */
export const rateLimitCounters = pgTable(
  "rate_limit_counters",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    action: text("action").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("rate_limit_counters_company_action_window_idx").on(
      table.companyId,
      table.action,
      table.windowStart,
    ),
    index("rate_limit_counters_window_start_idx").on(table.windowStart),
  ],
);
