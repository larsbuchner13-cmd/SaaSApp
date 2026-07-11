# Angebots-KI für Handwerksbetriebe

SaaS-Plattform für die KI-gestützte Angebotserstellung von Handwerksbetrieben.
Architektur, Domänenanalyse, Datenmodell und Roadmap: siehe [ARCHITECTURE.md](./ARCHITECTURE.md).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Neon Postgres
· Drizzle ORM · Clerk · Stripe · OpenAI · Vercel

## Entwicklung

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Scripts

| Befehl                 | Zweck                                       |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Dev-Server (Turbopack)                      |
| `npm run build`        | Production-Build                            |
| `npm run start`        | Production-Server                           |
| `npm run lint`         | ESLint                                      |
| `npm run typecheck`    | TypeScript ohne Emit                        |
| `npm run format`       | Prettier (schreibt)                         |
| `npm run format:check` | Prettier (nur prüfen, wie in CI)            |
| `npm run db:generate`  | Drizzle-Migration aus dem Schema generieren |
| `npm run db:migrate`   | Migrationen gegen `DATABASE_URL` anwenden   |
| `npm run db:seed`      | Systemrollen + Berechtigungen seeden        |
| `npm run db:studio`    | Drizzle Studio (DB-Browser)                 |
| `npm run test:e2e`     | Playwright E2E-Tests (siehe `e2e/`)         |

## Datenbank

Neon Postgres + Drizzle ORM, Zugriff über den `neon-http`-Treiber (HTTPS-basiert,
passend für Vercel Serverless Functions — kein klassischer TCP-Pool). Schema in
`db/schema/`, eine Datei pro Domäne (siehe ARCHITECTURE.md, Abschnitt 4).

## Deployment (Vercel)

Migrationen und Seed laufen automatisch bei jedem Deploy über das
`vercel-build`-Script (von Vercel als Next.js-Konvention automatisch anstelle
von `build` erkannt): `db:migrate` → `db:seed` → `next build`. Beides ist
idempotent und kann gefahrlos bei jedem Deploy erneut laufen.

Dafür einmalig in den Vercel-Projekteinstellungen (Settings → Environment
Variables) setzen, für Production und Preview:

- `DATABASE_URL` — die Neon-Connection-URL
- `NEXT_PUBLIC_APP_URL` — die tatsächliche Deployment-URL
- `OPENAI_API_KEY` — für den KI-Assistenten (M5)
- `BLOB_READ_WRITE_TOKEN` — für die PDF-Archivierung (M6)
- `RESEND_API_KEY` — für den E-Mail-Versand (M6)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` — für Billing (M7)
- `NEXT_PUBLIC_SENTRY_DSN` — optional, für Error-Monitoring (M9)

## Status

Meilenstein 9 (Security-Härtung, Rate-Limiting, Monitoring, E2E-Tests)
abgeschlossen — siehe ARCHITECTURE.md, Abschnitt "Priorisierte Roadmap".
Damit sind M0–M9 fertig; offen bleiben nur M10+ (zukünftige Module) und die
Clerk-Integration (s. u.).

- **Security-Header**: CSP, `X-Frame-Options`, HSTS etc. für alle Routen
  (`next.config.ts`).
- **Rate-Limiting**: Fixed-Window-Zähler pro Tenant + Aktion
  (`services/security/rate-limit.ts`, Tabelle `rate_limit_counters`) schützt
  KI-Generierung und E-Mail-Versand vor Bursts — unabhängig von den
  monatlichen Plan-Limits (`services/billing/check-usage-limit.ts`).
- **Monitoring**: Sentry (`@sentry/nextjs`) für Server, Edge und Client,
  aktiv sobald `NEXT_PUBLIC_SENTRY_DSN` gesetzt ist, sonst inaktiv (kein
  Boot-Fehler). Alle Fehlerpfade laufen über `lib/log-error.ts` statt
  rohem `console.error`.
- **E2E-Tests**: Playwright (`e2e/critical-flows.spec.ts`) deckt den
  Kern-Workflow ab (Kunde anlegen → Angebot mit Preisengine → PDF-Download),
  siehe `playwright.config.ts`. Braucht eine echte `DATABASE_URL` (Neon) und
  einen laufenden Dev-Server; `npm run test:e2e`.

Die KI (`ai/generate-offer-items.ts`) beschreibt ausschließlich Leistungen
über OpenAI Function Calling — sie berechnet nie Preise oder Mengen; das
bleibt Aufgabe der Preisengine (`services/pricing/`). Prompts sind versioniert
in `ai/prompts/` (als TS-Modul statt Dateisystem-Read, um Vercels
Serverless-File-Tracing nicht zu riskieren).

`server/tenant-context.ts` nutzt aktuell einen Platzhalter-Tenant (ein
Demo-Betrieb) statt eines echten Logins — Clerk-Integration folgt, sobald
Clerk-API-Keys vorliegen. Das ist der einzige Ort, der dafür ausgetauscht
wird; alle Features rufen nur `getTenantContext()` auf.
