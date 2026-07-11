import { z } from "zod";

import { pricingRuleTypeValues, pricingRuleValueTypeValues } from "@/db/schema";

export const pricingRuleFormSchema = z.object({
  type: z.enum(pricingRuleTypeValues),
  label: z.string().min(1, "Bezeichnung ist erforderlich").max(200),
  value: z.coerce.number().nonnegative("Wert darf nicht negativ sein"),
  valueType: z.enum(pricingRuleValueTypeValues),
});

export type PricingRuleFormInput = z.infer<typeof pricingRuleFormSchema>;
