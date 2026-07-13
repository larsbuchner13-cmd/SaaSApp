import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Content-Security-Policy wird bewusst NICHT hier gesetzt, sondern von
 * `clerkMiddleware()` in middleware.ts generiert — Clerk kennt dort seine
 * eigenen benoetigten Domains (Frontend-API, Cloudflare-Bot-Check) und
 * merged unsere zusaetzlichen Direktiven hinein. Zwei getrennte
 * CSP-Header (hier + Middleware) wuerden vom Browser als UND verknuepft
 * durchgesetzt und Clerk blockieren, selbst wenn nur einer der beiden
 * Header zu restriktiv ist.
 */
const securityHeaders = [
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
