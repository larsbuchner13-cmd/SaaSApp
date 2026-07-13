import "server-only";

import type { WebhookEvent } from "@clerk/nextjs/server";

import { mapClerkOrgRoleToRoleKey } from "@/auth/sync-clerk";
import {
  getCompanyByClerkOrgId,
  upsertCompanyFromClerkOrg,
} from "@/repositories/companies";
import {
  disableMembership,
  upsertMembershipFromClerk,
} from "@/repositories/memberships";
import { ensureSubscription } from "@/repositories/subscriptions";
import {
  getUserByClerkUserId,
  upsertUserFromClerk,
} from "@/repositories/users";

function primaryEmailOf(user: {
  email_addresses: Array<{ id: string; email_address: string }>;
  primary_email_address_id: string | null;
}): string | undefined {
  return (
    user.email_addresses.find((e) => e.id === user.primary_email_address_id)
      ?.email_address ?? user.email_addresses[0]?.email_address
  );
}

/**
 * Verarbeitet ein bereits signaturgeprueftes Clerk-Event (siehe
 * app/api/webhooks/clerk/route.ts). Haelt companies/users/memberships mit
 * Clerk synchron, nachdem `server/tenant-context.ts` sie beim ersten
 * Zugriff Just-in-time angelegt hat (Umbenennung der Organisation, neues
 * Mitglied, Mitglied entfernt).
 */
export async function handleClerkWebhookEvent(
  event: WebhookEvent,
): Promise<void> {
  switch (event.type) {
    case "organization.created":
    case "organization.updated": {
      const org = event.data;
      const company = await upsertCompanyFromClerkOrg({
        clerkOrgId: org.id,
        name: org.name,
        slug: org.slug,
      });
      await ensureSubscription(company.id);
      break;
    }

    case "user.created":
    case "user.updated": {
      const user = event.data;
      const email = primaryEmailOf(user);
      if (!email) break;

      await upsertUserFromClerk({
        clerkUserId: user.id,
        email,
        name:
          [user.first_name, user.last_name].filter(Boolean).join(" ") ||
          undefined,
        avatarUrl: user.image_url,
      });
      break;
    }

    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const membership = event.data;
      const [company, user] = await Promise.all([
        getCompanyByClerkOrgId(membership.organization.id),
        getUserByClerkUserId(membership.public_user_data.user_id),
      ]);
      // Fehlt Company/User hier noch, uebernimmt der Just-in-time-Fallback
      // in getTenantContext() den Sync beim naechsten Login.
      if (!company || !user) break;

      await upsertMembershipFromClerk(company.id, {
        userId: user.id,
        roleKey: mapClerkOrgRoleToRoleKey(membership.role),
      });
      break;
    }

    case "organizationMembership.deleted": {
      const membership = event.data;
      const [company, user] = await Promise.all([
        getCompanyByClerkOrgId(membership.organization.id),
        getUserByClerkUserId(membership.public_user_data.user_id),
      ]);
      if (!company || !user) break;

      await disableMembership(company.id, user.id);
      break;
    }

    default:
      break;
  }
}
