"use client";

import { UnexpectedErrorPage } from "@/components/pages/UnexpectedErrorPage";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <UnexpectedErrorPage reset={reset} digest={error.digest} />;
}
