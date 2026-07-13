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
export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  await auth.protect();

  if (isOnboardingRoute(req)) return;

  const { orgId } = await auth();
  if (!orgId) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
