"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  PermissionDeniedError,
  requirePermission,
} from "@/permissions/require-permission";
import { createCustomer, softDeleteCustomer } from "@/repositories/customers";
import { getTenantContext } from "@/server/tenant-context";

import { customerFormSchema } from "./schemas";

export type CustomerActionState = { error?: string } | undefined;

function fieldOf(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createCustomerAction(
  _prevState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = customerFormSchema.safeParse({
    name: fieldOf(formData, "name"),
    contactPerson: fieldOf(formData, "contactPerson"),
    email: fieldOf(formData, "email"),
    phone: fieldOf(formData, "phone"),
    street: fieldOf(formData, "street"),
    zip: fieldOf(formData, "zip"),
    city: fieldOf(formData, "city"),
    notes: fieldOf(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.",
    };
  }

  const { companyId, userId } = await getTenantContext();

  try {
    await requirePermission({
      companyId,
      userId,
      permission: "customers:create",
    });
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { error: "Du hast keine Berechtigung, Kunden anzulegen." };
    }
    throw error;
  }

  const data = parsed.data;
  const hasAddress = Boolean(data.street || data.zip || data.city);

  let customerId: string;
  try {
    const customer = await createCustomer(companyId, {
      name: data.name,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: hasAddress
        ? { street: data.street, zip: data.zip, city: data.city }
        : undefined,
      notes: data.notes,
    });
    customerId = customer.id;
  } catch {
    return {
      error: "Kunde konnte nicht gespeichert werden. Bitte versuche es erneut.",
    };
  }

  revalidatePath("/customers");
  redirect(`/customers/${customerId}`);
}

export async function deleteCustomerAction(customerId: string) {
  const { companyId, userId } = await getTenantContext();
  await requirePermission({
    companyId,
    userId,
    permission: "customers:delete",
  });
  await softDeleteCustomer(companyId, customerId);
  revalidatePath("/customers");
  redirect("/customers");
}
