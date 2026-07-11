"use server";

import { redirect } from "next/navigation";

import { recordAuditLog } from "@/audit/record";
import { stripe } from "@/billing/stripe-client";
import { env } from "@/config/env";
import { getPlanPriceId, planLabels } from "@/config/plans";
import type { Plan } from "@/config/plans";
import {
  PermissionDeniedError,
  requirePermission,
} from "@/permissions/require-permission";
import { getCompanyById } from "@/repositories/companies";
import {
  getSubscriptionByCompanyId,
  setSubscriptionStripeCustomerId,
} from "@/repositories/subscriptions";
import { getTenantContext } from "@/server/tenant-context";

export type BillingActionState = { error?: string } | undefined;

const GENERIC_CHECKOUT_ERROR =
  "Checkout konnte nicht gestartet werden. Bitte versuche es erneut.";

/**
 * Curried mit `plan`, damit die aufrufende Form `.bind(null, plan)`
 * verwenden und trotzdem als natives `<form action={formAction}>` mit
 * `useActionState` funktionieren kann — siehe die Lektion aus dem
 * Angebotsformular: `redirect()` aus einer Server Action muss ueber
 * echte Formular-Submission laufen, nicht ueber einen manuellen
 * `formAction(payload)`-Aufruf, sonst zeigt der Browser einen falschen
 * Client-Fehler trotz erfolgreicher Server-Aktion.
 */
export async function createCheckoutSessionAction(
  plan: Plan,
  _prevState: BillingActionState,
  _formData: FormData,
): Promise<BillingActionState> {
  const priceId = getPlanPriceId(plan);
  if (!priceId) {
    return {
      error: `Der Tarif "${planLabels[plan]}" ist noch nicht eingerichtet.`,
    };
  }

  let checkoutUrl: string;
  try {
    const { companyId, userId } = await getTenantContext();
    await requirePermission({
      companyId,
      userId,
      permission: "billing:manage",
    });

    const [company, subscription] = await Promise.all([
      getCompanyById(companyId),
      getSubscriptionByCompanyId(companyId),
    ]);
    if (!company) {
      return { error: "Firma wurde nicht gefunden." };
    }

    let stripeCustomerId = subscription?.stripeCustomerId ?? undefined;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: company.name,
        metadata: { companyId },
      });
      stripeCustomerId = customer.id;
      await setSubscriptionStripeCustomerId(companyId, stripeCustomerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing?checkout=success`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing?checkout=canceled`,
      client_reference_id: companyId,
      metadata: { companyId, plan },
    });

    if (!session.url) {
      return { error: GENERIC_CHECKOUT_ERROR };
    }

    await recordAuditLog({
      companyId,
      actorId: userId,
      action: "billing.checkout_started",
      entityType: "subscription",
      metadata: { plan },
    });

    checkoutUrl = session.url;
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { error: "Du hast keine Berechtigung, den Tarif zu ändern." };
    }
    console.error("createCheckoutSessionAction failed:", error);
    return { error: GENERIC_CHECKOUT_ERROR };
  }

  redirect(checkoutUrl);
}

export async function createPortalSessionAction(
  _prevState: BillingActionState,
  _formData: FormData,
): Promise<BillingActionState> {
  let portalUrl: string;
  try {
    const { companyId, userId } = await getTenantContext();
    await requirePermission({
      companyId,
      userId,
      permission: "billing:manage",
    });

    const subscription = await getSubscriptionByCompanyId(companyId);
    if (!subscription?.stripeCustomerId) {
      return { error: "Es ist noch kein Zahlungskonto hinterlegt." };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    });

    portalUrl = session.url;
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return {
        error: "Du hast keine Berechtigung, die Abrechnung zu verwalten.",
      };
    }
    console.error("createPortalSessionAction failed:", error);
    return {
      error:
        "Kundenportal konnte nicht geöffnet werden. Bitte versuche es erneut.",
    };
  }

  redirect(portalUrl);
}
