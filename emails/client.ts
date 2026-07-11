import "server-only";

import { Resend } from "resend";

import { env } from "@/config/env";

export const resend = new Resend(env.RESEND_API_KEY);

/**
 * Absenderadresse fuer Transaktions-E-Mails. `onboarding@resend.dev`
 * funktioniert ohne verifizierte eigene Domain (Resend-Sandbox-Absender)
 * — sobald eine Firmendomain in Resend verifiziert ist, hier ersetzen.
 */
export const EMAIL_FROM = "Angebots-KI <onboarding@resend.dev>";
