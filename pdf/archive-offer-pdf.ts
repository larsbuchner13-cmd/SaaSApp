import "server-only";

import { put } from "@vercel/blob";

import { env } from "@/config/env";
import { createAttachment } from "@/repositories/attachments";

/**
 * Laedt ein generiertes Angebots-PDF in Vercel Blob hoch und verknuepft
 * es als Attachment mit dem Angebot. Bewusst fehlertolerant (wie
 * recordAuditLog/incrementUsageMetric) — ein fehlgeschlagenes Archivieren
 * darf einen ansonsten erfolgreichen PDF-Download nicht verhindern.
 */
export async function archiveOfferPdf(params: {
  companyId: string;
  offerId: string;
  offerNumber: string;
  pdfBytes: Uint8Array;
}): Promise<void> {
  try {
    const blob = await put(
      `offers/${params.companyId}/${params.offerId}/${params.offerNumber}.pdf`,
      Buffer.from(params.pdfBytes),
      {
        access: "public",
        contentType: "application/pdf",
        token: env.BLOB_READ_WRITE_TOKEN,
      },
    );

    await createAttachment({
      companyId: params.companyId,
      ownerType: "offer",
      ownerId: params.offerId,
      blobUrl: blob.url,
      mimeType: "application/pdf",
      sizeBytes: params.pdfBytes.byteLength,
    });
  } catch (error) {
    console.error("archiveOfferPdf failed:", error);
  }
}
