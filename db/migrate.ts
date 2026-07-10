import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL ist nicht gesetzt.");
  }

  const db = drizzle(neon(databaseUrl));

  console.log("Wende Migrationen an ...");
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("Migrationen erfolgreich angewendet.");
}

main().catch((error) => {
  console.error("Migration fehlgeschlagen:", error);
  process.exit(1);
});
