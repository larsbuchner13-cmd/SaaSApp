import { after, NextResponse } from "next/server";

import { recordAuditLog } from "@/audit/record";
import {
  PermissionDeniedError,
  requirePermission,
} from "@/permissions/require-permission";
import { archiveOfferPdf } from "@/pdf/archive-offer-pdf";
import { generateOfferPdf } from "@/pdf/offer-pdf";
import { getCompanyById } from "@/repositories/companies";
import { getOfferById } from "@/repositories/offers";
import { getTenantContext } from "@/server/tenant-context";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { companyId, userId } = await getTenantContext();

  try {
    await requirePermission({ companyId, userId, permission: "offers:read" });
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return new NextResponse("Keine Berechtigung.", { status: 403 });
    }
    throw error;
  }

  const [offer, company] = await Promise.all([
    getOfferById(companyId, id),
    getCompanyById(companyId),
  ]);

  if (!offer || !company) {
    return new NextResponse("Angebot nicht gefunden.", { status: 404 });
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateOfferPdf({
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
  } catch (error) {
    console.error("generateOfferPdf failed:", error);
    return new NextResponse("PDF konnte nicht erstellt werden.", {
      status: 500,
    });
  }

  await recordAuditLog({
    companyId,
    actorId: userId,
    action: "offer.pdf_generated",
    entityType: "offer",
    entityId: offer.id,
  });

  after(() =>
    archiveOfferPdf({
      companyId,
      offerId: offer.id,
      offerNumber: offer.offerNumber,
      pdfBytes,
    }),
  );

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${offer.offerNumber}.pdf"`,
    },
  });
}
