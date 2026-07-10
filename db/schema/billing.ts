import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { idColumn, timestampColumns } from "./_shared";
import { companies } from "./tenancy";

export const planValues = ["starter", "pro", "business", "enterprise"] as const;
export type Plan = (typeof planValues)[number];

export const subscriptionStatusValues = [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
] as const;
export type SubscriptionStatus = (typeof subscriptionStatusValues)[number];

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    plan: text("plan", { enum: planValues }).notNull().default("starter"),
    status: text("status", { enum: subscriptionStatusValues })
      .notNull()
      .default("trialing"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("subscriptions_company_id_idx").on(table.companyId),
    uniqueIndex("subscriptions_stripe_customer_id_idx").on(
      table.stripeCustomerId,
    ),
    uniqueIndex("subscriptions_stripe_subscription_id_idx").on(
      table.stripeSubscriptionId,
    ),
  ],
);

export const usageMetricKeyValues = [
  "offers_created",
  "ai_requests",
  "uploads",
  "storage_bytes",
] as const;
export type UsageMetricKey = (typeof usageMetricKeyValues)[number];

export const usageMetrics = pgTable(
  "usage_metrics",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    metricKey: text("metric_key", { enum: usageMetricKeyValues }).notNull(),
    /** Monatliches Abrechnungsfenster, Format YYYY-MM. */
    period: text("period").notNull(),
    value: integer("value").notNull().default(0),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("usage_metrics_company_metric_period_idx").on(
      table.companyId,
      table.metricKey,
      table.period,
    ),
    index("usage_metrics_company_id_idx").on(table.companyId),
  ],
);

export const featureFlagScopeValues = ["plan", "company"] as const;
export type FeatureFlagScope = (typeof featureFlagScopeValues)[number];

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: idColumn(),
    key: text("key").notNull(),
    scope: text("scope", { enum: featureFlagScopeValues }).notNull(),
    companyId: uuid("company_id").references(() => companies.id),
    plan: text("plan", { enum: planValues }),
    enabled: boolean("enabled").notNull().default(true),
    ...timestampColumns,
  },
  (table) => [index("feature_flags_key_idx").on(table.key)],
);
