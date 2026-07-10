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

| Befehl                 | Zweck                            |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Dev-Server (Turbopack)           |
| `npm run build`        | Production-Build                 |
| `npm run start`        | Production-Server                |
| `npm run lint`         | ESLint                           |
| `npm run typecheck`    | TypeScript ohne Emit             |
| `npm run format`       | Prettier (schreibt)              |
| `npm run format:check` | Prettier (nur prüfen, wie in CI) |

## Status

Meilenstein 1 (Projekt-Scaffold) — siehe ARCHITECTURE.md, Abschnitt "Priorisierte Roadmap".
