"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  PermissionDeniedError,
  requirePermission,
} from "@/permissions/require-permission";
import { listActivePricingRules } from "@/repositories/pricing-rules";
import {
  createOfferWithItems,
  getNextOfferNumber,
} from "@/repositories/offers";
import { calculateOfferTotals } from "@/services/pricing/calculate-offer-totals";
import { getTenantContext } from "@/server/tenant-context";

import { offerFormSchema, type OfferFormInput } from "./schemas";

const DEFAULT_VAT_RATE = 19;

export type OfferActionState = { error?: string } | undefined;

export async function createOfferAction(
  _prevState: OfferActionState,
  payload: OfferFormInput,
): Promise<OfferActionState> {
  const parsed = offerFormSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.",
    };
  }

  const { companyId, userId } = await getTenantContext();

  try {
    await requirePermission({ companyId, userId, permission: "offers:create" });
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { error: "Du hast keine Berechtigung, Angebote zu erstellen." };
    }
    throw error;
  }

  const data = parsed.data;
  const rules = await listActivePricingRules(companyId);
  const totals = calculateOfferTotals(
    data.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    {
      vatRate: DEFAULT_VAT_RATE,
      rules: rules.map((rule) => ({
        type: rule.type,
        value: Number(rule.value),
        valueType: rule.valueType,
      })),
    },
  );

  let offerId: string;
  try {
    const offerNumber = await getNextOfferNumber(companyId);
    const offer = await createOfferWithItems(companyId, {
      customerId: data.customerId,
      offerNumber,
      validUntil: data.validUntil,
      vatRate: DEFAULT_VAT_RATE.toFixed(2),
      totalNet: totals.totalNet.toFixed(2),
      totalGross: totals.totalGross.toFixed(2),
      items: data.items.map((item, index) => ({
        description: item.description,
        quantity: item.quantity.toFixed(2),
        unit: item.unit,
        unitPrice: item.unitPrice.toFixed(2),
        source: "manual",
        position: index,
      })),
    });
    offerId = offer.id;
  } catch {
    return {
      error:
        "Angebot konnte nicht gespeichert werden. Bitte versuche es erneut.",
    };
  }

  revalidatePath("/offers");
  redirect(`/offers/${offerId}`);
}
