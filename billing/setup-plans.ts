/**
 * Einmaliges Setup-Skript: legt die vier Stripe-Produkte/-Preise an
 * (idempotent ueber `lookup_key` — erneutes Ausfuehren erzeugt keine
 * Duplikate) und gibt die resultierenden Price-IDs zum Eintragen in
 * .env.local / Vercel Environment Variables aus.
 *
 * Aufruf: npm run stripe:setup-plans
 *
 * Muss lokal bzw. von einer Umgebung mit Zugriff auf api.stripe.com
 * laufen — nicht aus dieser Sandbox ausfuehrbar.
 */
import Stripe from "stripe";

import { planLabels, planLimits, planValues } from "@/config/plans";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt.");
}
const stripe = new Stripe(stripeSecretKey);

async function ensurePrice(plan: (typeof planValues)[number]) {
  const lookupKey = `angebots_ki_${plan}_monthly`;
  const limits = planLimits[plan];

  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
  });
  if (existing.data[0]) {
    return existing.data[0].id;
  }

  const product = await stripe.products.create({
    name: `Angebots-KI ${planLabels[plan]}`,
    description: `${limits.offersPerMonth === Infinity ? "Unbegrenzt" : limits.offersPerMonth} Angebote/Monat, ${limits.aiRequestsPerMonth === Infinity ? "unbegrenzte" : limits.aiRequestsPerMonth} KI-Anfragen/Monat, bis zu ${limits.employees === Infinity ? "unbegrenzt" : limits.employees} Mitarbeiter.`,
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: Math.round(limits.priceEuroPerMonth * 100),
    recurring: { interval: "month" },
    lookup_key: lookupKey,
  });

  return price.id;
}

async function main() {
  console.log("Lege Stripe-Produkte/-Preise an (idempotent) ...\n");

  const results: Record<string, string> = {};
  for (const plan of planValues) {
    results[plan] = await ensurePrice(plan);
    console.log(`  ${planLabels[plan]}: ${results[plan]}`);
  }

  console.log("\nIn .env.local und Vercel Environment Variables eintragen:\n");
  console.log(`STRIPE_PRICE_STARTER=${results.starter}`);
  console.log(`STRIPE_PRICE_PRO=${results.pro}`);
  console.log(`STRIPE_PRICE_BUSINESS=${results.business}`);
  console.log(`STRIPE_PRICE_ENTERPRISE=${results.enterprise}`);
}

main().catch((error) => {
  console.error("stripe:setup-plans fehlgeschlagen:", error);
  process.exit(1);
});
