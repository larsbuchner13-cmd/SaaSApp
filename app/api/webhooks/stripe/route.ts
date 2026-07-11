import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe } from "@/billing/stripe-client";
import { env } from "@/config/env";
import { handleStripeWebhookEvent } from "@/webhooks/stripe-handler";

export async function POST(request: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    console.error(
      "Stripe-Webhook empfangen, aber STRIPE_WEBHOOK_SECRET ist nicht gesetzt.",
    );
    return new NextResponse("Webhook nicht konfiguriert.", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Fehlende Signatur.", { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Stripe-Webhook-Signaturpruefung fehlgeschlagen:", error);
    return new NextResponse("Ungültige Signatur.", { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(event);
  } catch (error) {
    console.error("handleStripeWebhookEvent fehlgeschlagen:", error);
    return new NextResponse("Verarbeitung fehlgeschlagen.", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
