import "server-only";

import { incrementRateLimitCounter } from "@/repositories/rate-limits";

export class RateLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitExceededError";
  }
}

export type RateLimitedAction = "ai_generate_offer_items" | "send_offer_email";

const RATE_LIMITS: Record<
  RateLimitedAction,
  { limit: number; windowSeconds: number }
> = {
  // Schuetzt vor Kostenexplosion durch OpenAI-Abuse, unabhaengig vom
  // monatlichen Plan-Limit (checkUsageLimit), das Bursts nicht abfaengt.
  ai_generate_offer_items: { limit: 10, windowSeconds: 60 },
  // Schuetzt vor Spam-Versand ueber Resend (Reputationsrisiko der Absender-Domain).
  send_offer_email: { limit: 5, windowSeconds: 60 },
};

function windowStartFor(windowSeconds: number, now = new Date()): Date {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

/**
 * Fixed-Window-Rate-Limit pro Tenant + Aktion. Wirft RateLimitExceededError,
 * BEVOR die eigentliche (teure/missbrauchsanfaellige) Aktion ausgefuehrt
 * wird. Ergaenzt `checkUsageLimit` (monatliches Plan-Limit) um einen
 * kurzfristigen Burst-Schutz, der unabhaengig vom Tarif gilt.
 */
export async function checkRateLimit(
  companyId: string,
  action: RateLimitedAction,
): Promise<void> {
  const { limit, windowSeconds } = RATE_LIMITS[action];
  const windowStart = windowStartFor(windowSeconds);
  const count = await incrementRateLimitCounter(companyId, action, windowStart);

  if (count > limit) {
    throw new RateLimitExceededError(
      "Zu viele Anfragen in kurzer Zeit. Bitte warte einen Moment und versuche es erneut.",
    );
  }
}
