import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function getUserByClerkUserId(clerkUserId: string) {
  return db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkUserId),
  });
}

export async function createUser(data: {
  clerkUserId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

/**
 * Idempotenter Sync aus Clerk. Wird sowohl vom Clerk-Webhook als auch von
 * `getTenantContext()` als Just-in-time-Fallback aufgerufen — siehe
 * upsertCompanyFromClerkOrg fuer die Begruendung.
 */
export async function upsertUserFromClerk(data: {
  clerkUserId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) {
  const [user] = await db
    .insert(users)
    .values(data)
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { email: data.email, name: data.name, avatarUrl: data.avatarUrl },
    })
    .returning();
  return user;
}
