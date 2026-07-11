"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="de">
      <body>
        {/* NextError verlangt statusCode als Pflichtprop, hier unbekannt -> generischer 500. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
