"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { useI18n } from "@/lib/i18n";
import { Button } from "@hosanna/ui";
import Link from "next/link";

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <AuthLayout
      headerTitle={t("errors.notFound.title")}
      headerSubtitle={t("errors.notFound.subtitle")}
    >
      <div className="space-y-6 text-center">
        <p className="text-5xl font-semibold tracking-tight text-m3-primary tabular-nums">
          {t("errors.notFound.code")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="block sm:flex-1">
            <Button type="button" className="w-full rounded-full">
              {t("common.goHome")}
            </Button>
          </Link>
          <Link href="/login" className="block sm:flex-1">
            <Button type="button" variant="outline" className="w-full rounded-full">
              {t("errors.notFound.login")}
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
