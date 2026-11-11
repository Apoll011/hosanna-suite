"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { useI18n } from "@/lib/ui/i18n";
import { Button } from "@hosanna/ui";
import Link from "next/link";

export function UnexpectedErrorPage({ reset, digest }: { reset?: () => void; digest?: string }) {
  const { t } = useI18n();

  return (
    <AuthLayout
      headerTitle={t("errors.unexpected.title")}
      headerSubtitle={t("errors.unexpected.subtitle")}
      errorMsg={digest ? `Ref: ${digest}` : undefined}
    >
      {reset ? (
        <Button type="button" className="w-full rounded-full" onClick={reset}>
          {t("errors.unexpected.retry")}
        </Button>
      ) : (
        <Link href="/login" className="block">
          <Button type="button" className="w-full rounded-full">
            {t("errors.notFound.login")}
          </Button>
        </Link>
      )}
    </AuthLayout>
  );
}
