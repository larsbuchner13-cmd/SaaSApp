import { db } from "@/db/client";
import { attachments } from "@/db/schema";
import type { AttachmentOwnerType } from "@/db/schema";

export async function createAttachment(data: {
  companyId: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  blobUrl: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const [attachment] = await db.insert(attachments).values(data).returning();
  return attachment;
}
