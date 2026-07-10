import {
  boolean,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { idColumn, timestampColumns } from "./_shared";
import { companies } from "./tenancy";

export const materials = pgTable(
  "materials",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    name: text("name").notNull(),
    sku: text("sku"),
    unit: text("unit").notNull().default("Stk"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    supplierRef: text("supplier_ref"),
    ...timestampColumns,
  },
  (table) => [index("materials_company_id_idx").on(table.companyId)],
);

export const pricingRuleTypeValues = [
  "discount",
  "surcharge",
  "travel",
  "disposal",
  "overhead",
  "margin",
] as const;
export type PricingRuleType = (typeof pricingRuleTypeValues)[number];

export const pricingRuleValueTypeValues = ["percentage", "fixed"] as const;
export type PricingRuleValueType = (typeof pricingRuleValueTypeValues)[number];

export const pricingRules = pgTable(
  "pricing_rules",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    type: text("type", { enum: pricingRuleTypeValues }).notNull(),
    label: text("label").notNull(),
    value: numeric("value", { precision: 10, scale: 4 }).notNull(),
    valueType: text("value_type", { enum: pricingRuleValueTypeValues })
      .notNull()
      .default("percentage"),
    conditions: jsonb("conditions").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestampColumns,
  },
  (table) => [index("pricing_rules_company_id_idx").on(table.companyId)],
);
