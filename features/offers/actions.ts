"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateOfferItems } from "@/ai/generate-offer-items";
import type { GeneratedOfferItem } from "@/ai/schemas/offer-items";
import { recordAuditLog } from "@/audit/record";
import { EMAIL_FROM, resend } from "@/emails/client";
import { renderOfferEmail } from "@/emails/offer-email";
import {
  PermissionDeniedError,
  requirePermission,
} from "@/permissions/require-permission";
import { generateOfferPdf } from "@/pdf/offer-pdf";
import { getCompanyById } from "@/repositories/companies";
import {
  createOfferWithItems,
  getNextOfferNumber,
  getOfferById,
  markOfferAsSent,
  softDeleteOffer,
  updateOfferWithItems,
} from "@/repositories/offers";
import { listActivePricingRules } from "@/repositories/pricing-rules";
import { incrementUsageMetric } from "@/repositories/usage-metrics";
import {
  UsageLimitExceededError,
  checkUsageLimit,
} from "@/services/billing/check-usage-limit";
import { calculateOfferTotals } from "@/services/pricing/calculate-offer-totals";
import { getTenantContext } from "@/server/tenant-context";

import { offerFormSchema } from "./schemas";

const DEFAULT_VAT_RATE = 19;
const GENERIC_ERROR =
  "Angebot konnte nicht gespeichert werden. Bitte versuche es erneut.";

export type OfferActionState = { error?: string } | undefined;

function fieldOf(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseItemsField(formData: FormData): unknown[] {
  const raw = fieldOf(formData, "items");
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function createOfferAction(
  _prevState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const parsed = offerFormSchema.safeParse({
    customerId: fieldOf(formData, "customerId"),
    validUntil: fieldOf(formData, "validUntil"),
    items: parseItemsField(formData),
  });

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
    await checkUsageLimit(companyId, "offers_created");

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
        source: item.source,
        position: index,
      })),
    });
    offerId = offer.id;

    await recordAuditLog({
      companyId,
      actorId: userId,
      action: "offer.created",
      entityType: "offer",
      entityId: offer.id,
      metadata: { offerNumber },
    });
    await incrementUsageMetric(companyId, "offers_created");
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { error: "Du hast keine Berechtigung, Angebote zu erstellen." };
    }
    if (error instanceof UsageLimitExceededError) {
      return { error: error.message };
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
  formData: FormData,
): Promise<OfferActionState> {
  const parsed = offerFormSchema.safeParse({
    customerId: fieldOf(formData, "customerId"),
    validUntil: fieldOf(formData, "validUntil"),
    items: parseItemsField(formData),
  });

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
        source: item.source,
        position: index,
      })),
    });

    await recordAuditLog({
      companyId,
      actorId: userId,
      action: "offer.updated",
      entityType: "offer",
      entityId: offerId,
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

    await recordAuditLog({
      companyId,
      actorId: userId,
      action: "offer.deleted",
      entityType: "offer",
      entityId: offerId,
    });
  } catch (error) {
    console.error("deleteOfferAction failed:", error);
    return;
  }

  revalidatePath("/offers");
  redirect("/offers");
}

export type GenerateOfferItemsResult =
  { items: GeneratedOfferItem[] } | { error: string };

const AI_GENERIC_ERROR =
  "KI-Vorschlag konnte nicht erstellt werden. Bitte versuche es erneut oder gib die Positionen manuell ein.";

export async function generateOfferItemsAction(
  description: string,
): Promise<GenerateOfferItemsResult> {
  const trimmed = description.trim();
  if (!trimmed) {
    return { error: "Bitte beschreibe zuerst, was zu tun ist." };
  }

  try {
    const { companyId, userId } = await getTenantContext();
    await requirePermission({ companyId, userId, permission: "offers:create" });
    await checkUsageLimit(companyId, "ai_requests");

    const items = await generateOfferItems(trimmed);

    await recordAuditLog({
      companyId,
      actorId: userId,
      action: "ai.offer_items_generated",
      entityType: "offer",
      metadata: { itemCount: items.length },
    });
    await incrementUsageMetric(companyId, "ai_requests");

    return { items };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return {
        error: "Du hast keine Berechtigung, den KI-Assistenten zu nutzen.",
      };
    }
    if (error instanceof UsageLimitExceededError) {
      return { error: error.message };
    }
    console.error("generateOfferItemsAction failed:", error);
    return { error: AI_GENERIC_ERROR };
  }
}

export type SendOfferEmailResult = { success: true } | { error: string };

const SEND_GENERIC_ERROR =
  "E-Mail konnte nicht versendet werden. Bitte versuche es erneut.";

export async function sendOfferEmailAction(
  offerId: string,
  message: string,
): Promise<SendOfferEmailResult> {
  try {
    const { companyId, userId } = await getTenantContext();
    await requirePermission({ companyId, userId, permission: "offers:send" });

    const [offer, company] = await Promise.all([
      getOfferById(companyId, offerId),
      getCompanyById(companyId),
    ]);

    if (!offer || !company) {
      return { error: "Angebot wurde nicht gefunden." };
    }
    if (!offer.customer.email) {
      return {
        error: "Für diesen Kunden ist keine E-Mail-Adresse hinterlegt.",
      };
    }

    const pdfBytes = await generateOfferPdf({
      offer: {
        offerNumber: offer.offerNumber,
        validUntil: offer.validUntil,
        notes: offer.notes,
        vatRate: offer.vatRate,
        totalNet: offer.totalNet,
        totalGross: offer.totalGross,
        createdAt: offer.createdAt,
        customer: {
          name: offer.customer.name,
          contactPerson: offer.customer.contactPerson,
          address: offer.customer.address,
        },
        items: offer.items
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
          })),
      },
      company: { name: company.name, address: company.address },
    });

    const email = renderOfferEmail({
      offerNumber: offer.offerNumber,
      customerName: offer.customer.name,
      companyName: company.name,
      totalGross: Number(offer.totalGross),
      validUntil: offer.validUntil,
      message: message.trim() || undefined,
    });

    const { error: sendError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: offer.customer.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: [
        {
          filename: `${offer.offerNumber}.pdf`,
          content: Buffer.from(pdfBytes),
        },
      ],
    });

    if (sendError) {
      console.error("resend.emails.send failed:", sendError);
      return { error: SEND_GENERIC_ERROR };
    }

    await markOfferAsSent(companyId, offerId);

    await recordAuditLog({
      companyId,
      actorId: userId,
      action: "offer.sent",
      entityType: "offer",
      entityId: offerId,
      metadata: { to: offer.customer.email },
    });

    revalidatePath("/offers");
    revalidatePath(`/offers/${offerId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { error: "Du hast keine Berechtigung, Angebote zu versenden." };
    }
    console.error("sendOfferEmailAction failed:", error);
    return { error: SEND_GENERIC_ERROR };
  }
}
