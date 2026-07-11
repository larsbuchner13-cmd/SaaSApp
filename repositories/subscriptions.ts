import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { subscriptions } from "@/db/schema";
import type { Plan, SubscriptionStatus } from "@/db/schema";

export async function getSubscriptionByCompanyId(companyId: string) {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.companyId, companyId),
  });
}

export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string,
) {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeCustomerId, stripeCustomerId),
  });
}

export async function getSubscriptionByStripeSubscriptionId(
  stripeSubscriptionId: string,
) {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
  });
}

/**
 * Legt die Default-Subscription fuer eine neue Firma an (Trial auf
 * Starter-Limits). `companyId` ist eindeutig — ein zweiter Aufruf fuer
 * dieselbe Firma ist ein No-Op (ON CONFLICT DO NOTHING), damit das
 * Tenant-Bootstrapping idempotent bleibt.
 */
export async function ensureSubscription(companyId: string) {
  await db
    .insert(subscriptions)
    .values({ companyId, plan: "starter", status: "trialing" })
    .onConflictDoNothing({ target: subscriptions.companyId });
}

export async function setSubscriptionStripeCustomerId(
  companyId: string,
  stripeCustomerId: string,
) {
  await db
    .update(subscriptions)
    .set({ stripeCustomerId })
    .where(eq(subscriptions.companyId, companyId));
}

export async function updateSubscriptionByStripeCustomerId(
  stripeCustomerId: string,
  data: {
    stripeSubscriptionId?: string | null;
    plan?: Plan;
    status?: SubscriptionStatus;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  },
) {
  await db
    .update(subscriptions)
    .set(data)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId));
}
