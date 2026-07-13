import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/onboarding"]);

/**
 * Company = Clerk Organization (siehe ARCHITECTURE.md, Abschnitt 5). Ein
 * angemeldeter Nutzer ohne aktive Organisation darf noch keine
 * Dashboard-Route sehen — `getTenantContext()` haette sonst keine
 * `orgId`, aus der es einen Tenant ableiten koennte.
 */
export default clerkMiddleware(
  async (auth, req) => {
    if (isPublicRoute(req)) return;

    await auth.protect();

    if (isOnboardingRoute(req)) return;

    const { orgId } = await auth();
    if (!orgId) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  },
  {
    /**
     * Clerk generiert die CSP selbst (inkl. seiner eigenen Frontend-API-
     * Domain, Cloudflare-Bot-Check etc.) und merged unsere zusaetzlichen
     * Direktiven hinein — das ist robuster als sie hier von Hand zu
     * pflegen. Eine rein statische CSP in next.config.ts (wie zuvor)
     * kennt Clerks Domains nicht und blockiert dessen Script/Requests
     * (leere Seite beim Anmelden), da mehrere CSP-Header vom Browser als
     * UND verknuepft durchgesetzt werden.
     */
    contentSecurityPolicy: {
      directives: {
        "connect-src": ["https://*.sentry.io"],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'self'"],
      },
    },
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
