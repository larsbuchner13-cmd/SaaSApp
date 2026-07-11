import { z } from "zod";

export const offerItemSchema = z.object({
  description: z.string().min(1, "Beschreibung ist erforderlich").max(500),
  quantity: z.coerce.number().positive("Menge muss größer als 0 sein"),
  unit: z.string().min(1, "Einheit erforderlich").max(20),
  unitPrice: z.coerce.number().nonnegative("Preis darf nicht negativ sein"),
  source: z.enum(["manual", "ai"]).default("manual"),
});

export const offerFormSchema = z.object({
  customerId: z.string().uuid("Bitte einen Kunden auswählen"),
  validUntil: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  items: z
    .array(offerItemSchema)
    .min(1, "Mindestens eine Position ist erforderlich"),
});

export type OfferItemInput = z.infer<typeof offerItemSchema>;
export type OfferFormInput = z.infer<typeof offerFormSchema>;
