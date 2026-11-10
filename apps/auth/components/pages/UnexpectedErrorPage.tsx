"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { useI18n } from "@/lib/i18n";
import { Button } from "@hosanna/ui";
import Link from "next/link";

export function UnexpectedErrorPage({
  reset,
  digest,
}: {
  reset?: () => void;
  digest?: string;
}) {
  const { t } = useI18n();

  return (
    <AuthLayout
      headerTitle={t("errors.unexpected.title")}
      headerSubtitle={t("errors.unexpected.subtitle")}
      errorMsg={digest ? `Ref: ${digest}` : undefined}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        {reset ? (
          <Button type="button" className="w-full rounded-full sm:flex-1" onClick={reset}>
            {t("errors.unexpected.retry")}
          </Button>
        ) : null}
        <Link href="/" className="block sm:flex-1">
          <Button type="button" variant="outline" className="w-full rounded-full">
            {t("common.goHome")}
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
