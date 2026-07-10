import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { offerItems, offers } from "@/db/schema";
import type { OfferItemSource } from "@/db/schema";

export async function listOffers(tenantId: string) {
  return db.query.offers.findMany({
    where: eq(offers.companyId, tenantId),
    orderBy: desc(offers.createdAt),
    with: { customer: true },
  });
}

export async function getOfferById(tenantId: string, offerId: string) {
  return db.query.offers.findFirst({
    where: and(eq(offers.companyId, tenantId), eq(offers.id, offerId)),
    with: { customer: true, items: true },
  });
}

/**
 * Erzeugt Angebot + Positionen atomar in einem einzigen Request. Die
 * Angebots-ID wird clientseitig generiert (statt ueber RETURNING geloopt),
 * weil der neon-http-Treiber `db.batch()` nur unabhaengige Statements in
 * einem HTTP-Roundtrip unterstuetzt — keine voneinander abhaengigen
 * Mehrfach-Queries wie bei einer klassischen interaktiven Transaktion.
 */
export async function createOfferWithItems(
  tenantId: string,
  data: {
    customerId: string;
    offerNumber: string;
    validUntil?: string;
    items: Array<{
      description: string;
      quantity: string;
      unit: string;
      unitPrice: string;
      materialId?: string;
      source?: OfferItemSource;
      position: number;
    }>;
  },
) {
  const offerId = randomUUID();
  const offerValues = {
    id: offerId,
    companyId: tenantId,
    customerId: data.customerId,
    offerNumber: data.offerNumber,
    validUntil: data.validUntil,
  };

  if (data.items.length === 0) {
    const [offer] = await db.insert(offers).values(offerValues).returning();
    return offer;
  }

  const [[offer]] = await db.batch([
    db.insert(offers).values(offerValues).returning(),
    db.insert(offerItems).values(
      data.items.map((item) => ({
        companyId: tenantId,
        offerId,
        ...item,
      })),
    ),
  ]);

  return offer;
}
