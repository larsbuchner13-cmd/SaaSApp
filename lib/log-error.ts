import * as Sentry from "@sentry/nextjs";

/**
 * Zentrale Fehlerprotokollierung: loggt weiterhin nach stdout (Vercel-Logs)
 * UND meldet an Sentry, statt an jeder Stelle beides einzeln aufzurufen.
 * Ersetzt rohe `console.error`-Aufrufe in Server Actions/Route Handlers.
 */
export function logError(message: string, error: unknown): void {
  console.error(message, error);
  Sentry.captureException(error, { extra: { message } });
}
