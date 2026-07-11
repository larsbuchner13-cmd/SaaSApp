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
  getOfferById,
  softDeleteOffer,
  updateOfferWithItems,
} from "@/repositories/offers";
import { calculateOfferTotals } from "@/services/pricing/calculate-offer-totals";
import { getTenantContext } from "@/server/tenant-context";

import { offerFormSchema, type OfferFormInput } from "./schemas";

const DEFAULT_VAT_RATE = 19;
const GENERIC_ERROR =
  "Angebot konnte nicht gespeichert werden. Bitte versuche es erneut.";

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

  const data = parsed.data;
  let offerId: string;

  try {
    const { companyId, userId } = await getTenantContext();
    await requirePermission({ companyId, userId, permission: "offers:create" });

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
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { error: "Du hast keine Berechtigung, Angebote zu erstellen." };
    }
    console.error("createOfferAction failed:", error);
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/offers");
  redirect(`/offers/${offerId}`);
}

export async function updateOfferAction(
  offerId: string,
  _prevState: OfferActionState,
  payload: OfferFormInput,
): Promise<OfferActionState> {
  const parsed = offerFormSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Bitte prüfe deine Eingaben.",
    };
  }

  const data = parsed.data;

  try {
    const { companyId, userId } = await getTenantContext();
    await requirePermission({ companyId, userId, permission: "offers:update" });

    const existing = await getOfferById(companyId, offerId);
    if (!existing) {
      return { error: "Angebot wurde nicht gefunden." };
    }
    if (existing.status !== "draft") {
      return {
        error: "Nur Angebote im Entwurf können bearbeitet werden.",
      };
    }

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

    await updateOfferWithItems(companyId, offerId, {
      customerId: data.customerId,
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
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { error: "Du hast keine Berechtigung, Angebote zu bearbeiten." };
    }
    console.error("updateOfferAction failed:", error);
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/offers");
  revalidatePath(`/offers/${offerId}`);
  redirect(`/offers/${offerId}`);
}

export async function deleteOfferAction(offerId: string) {
  try {
    const { companyId, userId } = await getTenantContext();
    await requirePermission({ companyId, userId, permission: "offers:delete" });
    await softDeleteOffer(companyId, offerId);
  } catch (error) {
    console.error("deleteOfferAction failed:", error);
    return;
  }

  revalidatePath("/offers");
  redirect("/offers");
}
