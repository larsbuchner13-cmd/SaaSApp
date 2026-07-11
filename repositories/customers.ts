import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { customers } from "@/db/schema";

export async function listCustomers(tenantId: string) {
  return db.query.customers.findMany({
    where: and(eq(customers.companyId, tenantId), isNull(customers.deletedAt)),
    orderBy: desc(customers.createdAt),
  });
}

export async function getCustomerById(tenantId: string, customerId: string) {
  return db.query.customers.findFirst({
    where: and(
      eq(customers.companyId, tenantId),
      eq(customers.id, customerId),
      isNull(customers.deletedAt),
    ),
  });
}

export async function createCustomer(
  tenantId: string,
  data: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      zip?: string;
      city?: string;
      country?: string;
    };
    notes?: string;
  },
) {
  const [customer] = await db
    .insert(customers)
    .values({ companyId: tenantId, ...data })
    .returning();
  return customer;
}

export async function updateCustomer(
  tenantId: string,
  customerId: string,
  data: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      zip?: string;
      city?: string;
      country?: string;
    };
    notes?: string;
  },
) {
  const [customer] = await db
    .update(customers)
    .set(data)
    .where(and(eq(customers.companyId, tenantId), eq(customers.id, customerId)))
    .returning();
  return customer;
}

export async function softDeleteCustomer(tenantId: string, customerId: string) {
  await db
    .update(customers)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(customers.companyId, tenantId), eq(customers.id, customerId)),
    );
}
