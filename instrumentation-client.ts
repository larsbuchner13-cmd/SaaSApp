import * as Sentry from "@sentry/nextjs";

/**
 * Bewusst KEIN Import von `@/config/env`: das Modul validiert beim Import
 * auch serverseitige Pflichtvariablen (DATABASE_URL etc.), die im
 * Client-Bundle nicht vorhanden sind — ein Import hier wuerde die App im
 * Browser zum Absturz bringen. Next.js ersetzt `process.env.NEXT_PUBLIC_*`
 * statisch beim Build, daher direkter Zugriff ohne Zod-Validierung.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
