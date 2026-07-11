import { z } from "zod";

export const generatedOfferItemSchema = z.object({
  description: z.string().min(1).max(300),
  unit: z.string().min(1).max(20),
});

export const generatedOfferItemsSchema = z.object({
  items: z.array(generatedOfferItemSchema).min(1).max(20),
});

export type GeneratedOfferItem = z.infer<typeof generatedOfferItemSchema>;

/**
 * JSON Schema fuer OpenAI Function Calling — bewusst redundant zum
 * Zod-Schema oben (verschiedene Zwecke: dieses hier steuert, was das
 * Modell ueberhaupt zurueckgeben darf; Zod validiert die tatsaechliche
 * Antwort serverseitig, bevor sie irgendwo verwendet wird).
 */
export const PROPOSE_OFFER_ITEMS_TOOL = {
  type: "function" as const,
  function: {
    name: "propose_offer_items",
    description:
      "Schlägt strukturierte Angebotspositionen vor (nur Leistungsbeschreibung + Mengeneinheit, keine Preise, keine Mengen).",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          minItems: 1,
          maxItems: 20,
          items: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Klare, professionelle Leistungsbeschreibung",
              },
              unit: {
                type: "string",
                description:
                  "Passende Mengeneinheit, z. B. Stk, m, m², h, pauschal",
              },
            },
            required: ["description", "unit"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
};
