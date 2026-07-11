"use server";

import { revalidatePath } from "next/cache";

import { recordAuditLog } from "@/audit/record";
import { logError } from "@/lib/log-error";
import {
  PermissionDeniedError,
  requirePermission,
} from "@/permissions/require-permission";
import {
  createPricingRule,
  softDeletePricingRule,
} from "@/repositories/pricing-rules";
import { getTenantContext } from "@/server/tenant-context";

import { pricingRuleFormSchema } from "./schemas";

export type PricingRuleActionState = { error?: string } | undefined;

function fieldOf(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createPricingRuleAction(
  _prevState: PricingRuleActionState,
  formData: FormData,
): Promise<PricingRuleActionState> {
  const parsed = pricingRuleFormSchema.safeParse({
    type: fieldOf(formData, "type"),
    label: fieldOf(formData, "label"),
    value: fieldOf(formData, "value"),
    valueType: fieldOf(formData, "valueType"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.",
    };
  }

  try {
    const { companyId, userId } = await getTenantContext();
    await requirePermission({
      companyId,
      userId,
      permission: "pricing:manage",
    });

    const rule = await createPricingRule(companyId, {
      type: parsed.data.type,
      label: parsed.data.label,
      value: parsed.data.value.toFixed(4),
      valueType: parsed.data.valueType,
    });

    await recordAuditLog({
      companyId,
      actorId: userId,
      action: "pricing_rule.created",
      entityType: "pricing_rule",
      entityId: rule.id,
      metadata: { label: rule.label, type: rule.type },
    });
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { error: "Du hast keine Berechtigung, Preisregeln zu verwalten." };
    }
    logError("createPricingRuleAction failed:", error);
    return {
      error:
        "Preisregel konnte nicht gespeichert werden. Bitte versuche es erneut.",
    };
  }

  revalidatePath("/settings/pricing");
}

export async function deletePricingRuleAction(ruleId: string) {
  try {
    const { companyId, userId } = await getTenantContext();
    await requirePermission({
      companyId,
      userId,
      permission: "pricing:manage",
    });
    await softDeletePricingRule(companyId, ruleId);

    await recordAuditLog({
      companyId,
      actorId: userId,
      action: "pricing_rule.deleted",
      entityType: "pricing_rule",
      entityId: ruleId,
    });
  } catch (error) {
    logError("deletePricingRuleAction failed:", error);
    return;
  }

  revalidatePath("/settings/pricing");
}
