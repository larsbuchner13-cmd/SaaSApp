import { relations } from "drizzle-orm";

import { auditLogs } from "./audit";
import { customers } from "./customers";
import { offerItems, offers } from "./offers";
import { permissions, rolePermissions, roles } from "./rbac";
import { companies, memberships, users } from "./tenancy";

export const companiesRelations = relations(companies, ({ many }) => ({
  memberships: many(memberships),
  customers: many(customers),
  offers: many(offers),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  memberships: many(memberships),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const membershipsRelations = relations(memberships, ({ one }) => ({
  company: one(companies, {
    fields: [memberships.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [memberships.roleId],
    references: [roles.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  offers: many(offers),
}));

export const offersRelations = relations(offers, ({ one, many }) => ({
  company: one(companies, {
    fields: [offers.companyId],
    references: [companies.id],
  }),
  customer: one(customers, {
    fields: [offers.customerId],
    references: [customers.id],
  }),
  items: many(offerItems),
}));

export const offerItemsRelations = relations(offerItems, ({ one }) => ({
  offer: one(offers, {
    fields: [offerItems.offerId],
    references: [offers.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));
