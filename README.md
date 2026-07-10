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

## Status

Meilenstein 2 (Datenbankfundament) — siehe ARCHITECTURE.md, Abschnitt "Priorisierte Roadmap".
Clerk-Integration/Tenant-Context folgt, sobald Clerk-API-Keys vorliegen.
