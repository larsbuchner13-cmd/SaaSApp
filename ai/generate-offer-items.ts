import "server-only";

import { openai } from "./client";
import { OFFER_ITEMS_PROMPT_V1 } from "./prompts/offer-v1";
import {
  generatedOfferItemsSchema,
  PROPOSE_OFFER_ITEMS_TOOL,
  type GeneratedOfferItem,
} from "./schemas/offer-items";

const MODEL = "gpt-4o-mini";

/**
 * Extrahiert Angebotspositionen aus einer Freitextbeschreibung ueber
 * OpenAI Function Calling. Liefert ausschliesslich Beschreibung +
 * Einheit — niemals Preise oder Mengen (siehe ARCHITECTURE.md,
 * Abschnitt "Preisberechnung": die KI berechnet nie Preise).
 */
export async function generateOfferItems(
  input: string,
): Promise<GeneratedOfferItem[]> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: OFFER_ITEMS_PROMPT_V1 },
      { role: "user", content: input },
    ],
    tools: [PROPOSE_OFFER_ITEMS_TOOL],
    tool_choice: {
      type: "function",
      function: { name: "propose_offer_items" },
    },
  });

  const toolCall = completion.choices[0]?.message.tool_calls?.[0];
  if (!toolCall || toolCall.type !== "function") {
    throw new Error("KI hat keine strukturierte Antwort geliefert.");
  }

  let rawArgs: unknown;
  try {
    rawArgs = JSON.parse(toolCall.function.arguments);
  } catch {
    throw new Error("KI-Antwort war kein gültiges JSON.");
  }

  const parsed = generatedOfferItemsSchema.safeParse(rawArgs);
  if (!parsed.success) {
    throw new Error("KI-Antwort entsprach nicht dem erwarteten Format.");
  }

  return parsed.data.items;
}
