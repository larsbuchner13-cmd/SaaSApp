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
