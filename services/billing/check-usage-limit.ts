import "server-only";

import { planLimits } from "@/config/plans";
import { getSubscriptionByCompanyId } from "@/repositories/subscriptions";
import { getUsageMetric } from "@/repositories/usage-metrics";

export class UsageLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageLimitExceededError";
  }
}

type LimitedMetric = "offers_created" | "ai_requests";

const metricLabels: Record<LimitedMetric, string> = {
  offers_created: "Angebote",
  ai_requests: "KI-Anfragen",
};

/**
 * Prueft das monatliche Nutzungslimit des aktuellen Tarifs, BEVOR die
 * zaehlende Aktion ausgefuehrt wird (Angebot erstellen, KI-Anfrage). Wirft
 * UsageLimitExceededError statt eines rohen Fehlers, damit Aufrufer eine
 * freundliche Meldung anzeigen koennen. Firmen ohne Subscription-Zeile
 * (sollte durch ensureSubscription beim Anlegen nicht vorkommen) fallen auf
 * Starter-Limits zurueck.
 */
export async function checkUsageLimit(
  companyId: string,
  metricKey: LimitedMetric,
): Promise<void> {
  const subscription = await getSubscriptionByCompanyId(companyId);
  const plan = subscription?.plan ?? "starter";
  const limits = planLimits[plan];
  const limit =
    metricKey === "offers_created"
      ? limits.offersPerMonth
      : limits.aiRequestsPerMonth;

  if (limit === Infinity) return;

  const used = await getUsageMetric(companyId, metricKey);
  if (used >= limit) {
    throw new UsageLimitExceededError(
      `Monatliches Limit von ${limit} ${metricLabels[metricKey]} im Tarif erreicht. Bitte upgrade deinen Tarif unter Einstellungen > Abrechnung.`,
    );
  }
}
