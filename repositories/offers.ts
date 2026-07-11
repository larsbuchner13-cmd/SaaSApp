import { randomUUID } from "node:crypto";

import { and, count, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { offerItems, offers } from "@/db/schema";
import type { OfferItemSource } from "@/db/schema";

export async function listOffers(tenantId: string) {
  return db.query.offers.findMany({
    where: and(eq(offers.companyId, tenantId), isNull(offers.deletedAt)),
    orderBy: desc(offers.createdAt),
    with: { customer: true },
  });
}

export async function getOfferById(tenantId: string, offerId: string) {
  return db.query.offers.findFirst({
    where: and(
      eq(offers.companyId, tenantId),
      eq(offers.id, offerId),
      isNull(offers.deletedAt),
    ),
    with: { customer: true, items: true },
  });
}

export async function softDeleteOffer(tenantId: string, offerId: string) {
  await db
    .update(offers)
    .set({ deletedAt: new Date() })
    .where(and(eq(offers.companyId, tenantId), eq(offers.id, offerId)));
}

/**
 * Markiert ein Angebot als versendet — nur ein gueltiger Uebergang aus
 * "draft" heraus (siehe Status-Workflow in ARCHITECTURE.md). Kein Fehler
 * bei bereits versendeten Angeboten, damit ein erneuter Versand (z. B.
 * an eine zweite Adresse) den Status nicht zurueckwirft.
 */
export async function markOfferAsSent(tenantId: string, offerId: string) {
  await db
    .update(offers)
    .set({ status: "sent" })
    .where(
      and(
        eq(offers.companyId, tenantId),
        eq(offers.id, offerId),
        eq(offers.status, "draft"),
      ),
    );
}

/**
 * Fortlaufende Angebotsnummer pro Firma und Jahr (AN-2026-0001, ...).
 * Basiert auf der Gesamtanzahl bisheriger Angebote — bei sehr hoher
 * Nebenläufigkeit theoretisch kollisionsanfällig; für die Zielgruppe
 * (1-20 Mitarbeiter, kein paralleles Massenanlegen) ausreichend robust.
 * Ein DB-Sequence-Zähler kann das bei Bedarf später ersetzen, ohne dass
 * Aufrufer sich ändern müssen.
 */
export async function getNextOfferNumber(tenantId: string): Promise<string> {
  const [row] = await db
    .select({ value: count() })
    .from(offers)
    .where(eq(offers.companyId, tenantId));

  const year = new Date().getFullYear();
  const sequence = (row?.value ?? 0) + 1;
  return `AN-${year}-${String(sequence).padStart(4, "0")}`;
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
    vatRate: string;
    totalNet: string;
    totalGross: string;
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
    vatRate: data.vatRate,
    totalNet: data.totalNet,
    totalGross: data.totalGross,
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

/**
 * Ersetzt Kerndaten + alle Positionen eines bestehenden Angebots atomar.
 * Aufrufer muss vorher pruefen, dass das Angebot im Status "draft" ist —
 * diese Funktion selbst erzwingt das nicht.
 */
export async function updateOfferWithItems(
  tenantId: string,
  offerId: string,
  data: {
    customerId: string;
    validUntil?: string;
    vatRate: string;
    totalNet: string;
    totalGross: string;
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
  const offerUpdate = db
    .update(offers)
    .set({
      customerId: data.customerId,
      validUntil: data.validUntil,
      vatRate: data.vatRate,
      totalNet: data.totalNet,
      totalGross: data.totalGross,
    })
    .where(and(eq(offers.companyId, tenantId), eq(offers.id, offerId)));

  const itemsDelete = db
    .delete(offerItems)
    .where(
      and(eq(offerItems.companyId, tenantId), eq(offerItems.offerId, offerId)),
    );

  if (data.items.length === 0) {
    await db.batch([offerUpdate, itemsDelete]);
    return;
  }

  await db.batch([
    offerUpdate,
    itemsDelete,
    db.insert(offerItems).values(
      data.items.map((item) => ({
        companyId: tenantId,
        offerId,
        ...item,
      })),
    ),
  ]);
}
