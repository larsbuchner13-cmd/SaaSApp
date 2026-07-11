import { env } from "@/config/env";
import { planValues } from "@/db/schema";
import type { Plan } from "@/db/schema";

export { planValues };
export type { Plan };

export const planLabels: Record<Plan, string> = {
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

/**
 * Monatliche Limits je Tarif. Ausschliesslich serverseitig geprueft
 * (siehe services/billing/check-usage-limit.ts) — niemals im Frontend
 * versteckt. `Infinity` markiert ein unbegrenztes Limit.
 */
export type PlanLimits = {
  offersPerMonth: number;
  aiRequestsPerMonth: number;
  employees: number;
  priceEuroPerMonth: number;
};

export const planLimits: Record<Plan, PlanLimits> = {
  starter: {
    offersPerMonth: 20,
    aiRequestsPerMonth: 20,
    employees: 2,
    priceEuroPerMonth: 29,
  },
  pro: {
    offersPerMonth: 100,
    aiRequestsPerMonth: 150,
    employees: 5,
    priceEuroPerMonth: 79,
  },
  business: {
    offersPerMonth: 500,
    aiRequestsPerMonth: 750,
    employees: 20,
    priceEuroPerMonth: 199,
  },
  enterprise: {
    offersPerMonth: Infinity,
    aiRequestsPerMonth: Infinity,
    employees: Infinity,
    priceEuroPerMonth: 499,
  },
};

/**
 * Stripe-Price-ID je Tarif. Erst gesetzt, sobald `npm run
 * stripe:setup-plans` gelaufen ist (siehe billing/setup-plans.ts) — bis
 * dahin `undefined`, Aufrufer muessen das explizit behandeln statt einen
 * rohen Stripe-Fehler durchzureichen.
 */
export function getPlanPriceId(plan: Plan): string | undefined {
  const map: Record<Plan, string | undefined> = {
    starter: env.STRIPE_PRICE_STARTER,
    pro: env.STRIPE_PRICE_PRO,
    business: env.STRIPE_PRICE_BUSINESS,
    enterprise: env.STRIPE_PRICE_ENTERPRISE,
  };
  return map[plan];
}

/** Umkehrung von getPlanPriceId — fuer den Stripe-Webhook-Handler. */
export function resolvePlanFromPriceId(priceId: string): Plan | undefined {
  return planValues.find((plan) => getPlanPriceId(plan) === priceId);
}

export function formatPlanLimit(value: number): string {
  return value === Infinity ? "Unbegrenzt" : String(value);
}
