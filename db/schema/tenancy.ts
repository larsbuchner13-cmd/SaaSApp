import { jsonb, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { idColumn, timestampColumns } from "./_shared";
import { roles } from "./rbac";

export const companies = pgTable(
  "companies",
  {
    id: idColumn(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    clerkOrgId: text("clerk_org_id"),
    address: jsonb("address").$type<{
      street?: string;
      zip?: string;
      city?: string;
      country?: string;
    }>(),
    logoUrl: text("logo_url"),
    vatId: text("vat_id"),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("companies_slug_idx").on(table.slug),
    uniqueIndex("companies_clerk_org_id_idx").on(table.clerkOrgId),
  ],
);

export const users = pgTable(
  "users",
  {
    id: idColumn(),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("users_clerk_user_id_idx").on(table.clerkUserId),
    uniqueIndex("users_email_idx").on(table.email),
  ],
);

export const membershipStatusValues = [
  "invited",
  "active",
  "disabled",
] as const;
export type MembershipStatus = (typeof membershipStatusValues)[number];

export const memberships = pgTable(
  "memberships",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    userId: uuid("user_id").references(() => users.id),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    status: text("status", { enum: membershipStatusValues })
      .notNull()
      .default("invited"),
    invitedEmail: text("invited_email"),
    ...timestampColumns,
  },
  (table) => [
    uniqueIndex("memberships_company_user_idx").on(
      table.companyId,
      table.userId,
    ),
  ],
);
