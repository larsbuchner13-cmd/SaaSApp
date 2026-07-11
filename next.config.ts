import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * `unsafe-inline` fuer Styles ist noetig, da Tailwind/shadcn zur Laufzeit
 * inline Styles setzen; Next.js-Hydration-Inline-Scripts benoetigen
 * ebenfalls `unsafe-inline`, da kein Nonce-Setup vorhanden ist.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // Kein Sentry-Auth-Token in diesem Projekt hinterlegt -> Source-Map-Upload
  // wird uebersprungen, ohne den Build zu blockieren (Sentry-SDK-Verhalten).
  widenClientFileUpload: false,
  webpack: {
    automaticVercelMonitors: false,
    treeshake: { removeDebugLogging: true },
  },
});
