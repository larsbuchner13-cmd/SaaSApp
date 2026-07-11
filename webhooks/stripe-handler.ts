import "server-only";

import type Stripe from "stripe";

import { recordAuditLog } from "@/audit/record";
import { resolvePlanFromPriceId } from "@/config/plans";
import type { SubscriptionStatus } from "@/db/schema";
import {
  getSubscriptionByStripeCustomerId,
  updateSubscriptionByStripeCustomerId,
} from "@/repositories/subscriptions";

function customerIdOf(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): string {
  return typeof customer === "string" ? customer : customer.id;
}

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

async function logSubscriptionChange(
  stripeCustomerId: string,
  status: SubscriptionStatus,
): Promise<void> {
  const subscription =
    await getSubscriptionByStripeCustomerId(stripeCustomerId);
  if (!subscription) return;

  await recordAuditLog({
    companyId: subscription.companyId,
    action: "billing.subscription_updated",
    entityType: "subscription",
    entityId: subscription.id,
    metadata: { status },
  });
}

async function syncSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId = customerIdOf(subscription.customer);
  const item = subscription.items.data[0];
  const plan = item ? resolvePlanFromPriceId(item.price.id) : undefined;
  const status = mapStripeStatus(subscription.status);

  await updateSubscriptionByStripeCustomerId(customerId, {
    stripeSubscriptionId: subscription.id,
    ...(plan ? { plan } : {}),
    status,
    currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  await logSubscriptionChange(customerId, status);
}

/**
 * Verarbeitet ein bereits signaturgeprueftes Stripe-Event (siehe
 * app/api/webhooks/stripe/route.ts). Reine Business-Logik, kein
 * Signatur-Handling hier — die Trennung erlaubt es, diese Funktion
 * ohne echten Stripe-Request zu testen.
 */
export async function handleStripeWebhookEvent(
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = customerIdOf(subscription.customer);
      await updateSubscriptionByStripeCustomerId(customerId, {
        status: "canceled",
        cancelAtPeriodEnd: false,
      });
      await logSubscriptionChange(customerId, "canceled");
      break;
    }
    default:
      break;
  }
}
