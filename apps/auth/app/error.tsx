"use client";

import { UnexpectedErrorPage } from "@/components/pages/UnexpectedErrorPage";
import { captureException } from "@/lib/analytics";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { digest: error.digest });
  }, [error]);

  return <UnexpectedErrorPage reset={reset} digest={error.digest} />;
}
