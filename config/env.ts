import { z } from "zod";

/**
 * Env-Validation, serverseitig geprueft beim Boot (import in `app/layout.tsx`).
 * Wird schrittweise um Felder ergaenzt, sobald die jeweilige Integration
 * implementiert wird (siehe ARCHITECTURE.md, Abschnitt "Priorisierte Roadmap"):
 *   - M2: DATABASE_URL (Neon), CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
 *   - M9: SENTRY_DSN
 * Neue Vars gehoeren zwingend hierher, nie als roher `process.env`-Zugriff
 * an anderer Stelle im Code.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z
    .string()
    .url()
    .startsWith(
      "postgresql://",
      "DATABASE_URL muss eine Postgres-Connection-URL sein",
    ),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY darf nicht leer sein"),
  BLOB_READ_WRITE_TOKEN: z
    .string()
    .min(1, "BLOB_READ_WRITE_TOKEN darf nicht leer sein"),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY darf nicht leer sein"),
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, "STRIPE_SECRET_KEY darf nicht leer sein"),
  /**
   * Erst verfuegbar, sobald der Webhook-Endpunkt in Stripe angelegt ist
   * (braucht eine echte Deployment-URL) bzw. sobald `stripe:setup-plans`
   * einmal gelaufen ist. Bis dahin optional — die jeweiligen Features
   * pruefen selbst und liefern eine verstaendliche Fehlermeldung statt
   * die ganze App am Boot zu hindern.
   */
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_STARTER: z.string().min(1).optional(),
  STRIPE_PRICE_PRO: z.string().min(1).optional(),
  STRIPE_PRICE_BUSINESS: z.string().min(1).optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().min(1).optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

function parseEnv() {
  const server = serverEnvSchema.safeParse(process.env);
  const client = clientEnvSchema.safeParse(process.env);

  if (!server.success || !client.success) {
    const issues = [
      ...(server.success ? [] : server.error.issues),
      ...(client.success ? [] : client.error.issues),
    ]
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Ungueltige Umgebungsvariablen:\n${issues}`);
  }

  return { ...server.data, ...client.data };
}

export const env = parseEnv();
