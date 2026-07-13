import { clerkSetup } from "@clerk/testing/playwright";

/**
 * Holt ein Clerk-Testing-Token ueber die Backend-API (braucht einen
 * Test-Instance-Secret-Key, `sk_test_...` — wirft bei einem Live-Key).
 * Erlaubt `clerk.signIn()` in den Tests, Bot-Schutz/Captcha zu umgehen.
 */
export default async function globalSetup() {
  await clerkSetup();
}
