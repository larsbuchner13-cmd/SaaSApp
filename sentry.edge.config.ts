import * as Sentry from "@sentry/nextjs";

import { env } from "@/config/env";

Sentry.init({
  dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: 0.1,
});
