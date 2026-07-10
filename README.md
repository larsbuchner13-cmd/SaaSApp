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

## Status

Meilenstein 3 (Kundenverwaltung) — siehe ARCHITECTURE.md, Abschnitt "Priorisierte Roadmap".

`server/tenant-context.ts` nutzt aktuell einen Platzhalter-Tenant (ein
Demo-Betrieb) statt eines echten Logins — Clerk-Integration folgt, sobald
Clerk-API-Keys vorliegen. Das ist der einzige Ort, der dafür ausgetauscht
wird; alle Features rufen nur `getTenantContext()` auf.
