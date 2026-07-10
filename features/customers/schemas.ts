import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined);

export const customerFormSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").max(200),
  contactPerson: optionalText(200),
  email: z
    .string()
    .email("Ungültige E-Mail-Adresse")
    .max(200)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  phone: optionalText(50),
  street: optionalText(200),
  zip: optionalText(20),
  city: optionalText(200),
  notes: optionalText(2000),
});

export type CustomerFormInput = z.infer<typeof customerFormSchema>;
