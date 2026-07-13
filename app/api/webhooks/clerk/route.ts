import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/config/env";
import { logError } from "@/lib/log-error";
import { handleClerkWebhookEvent } from "@/webhooks/clerk-handler";

export async function POST(request: NextRequest) {
  if (!env.CLERK_WEBHOOK_SECRET) {
    logError(
      "Clerk-Webhook empfangen, aber CLERK_WEBHOOK_SECRET ist nicht gesetzt.",
      new Error("CLERK_WEBHOOK_SECRET fehlt"),
    );
    return new NextResponse("Webhook nicht konfiguriert.", { status: 500 });
  }

  let event: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    event = await verifyWebhook(request, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    });
  } catch (error) {
    logError("Clerk-Webhook-Signaturpruefung fehlgeschlagen:", error);
    return new NextResponse("Ungültige Signatur.", { status: 400 });
  }

  try {
    await handleClerkWebhookEvent(event);
  } catch (error) {
    logError("handleClerkWebhookEvent fehlgeschlagen:", error);
    return new NextResponse("Verarbeitung fehlgeschlagen.", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
