"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { useI18n } from "@/lib/ui/i18n";
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
        <Link href="/login" className="block">
          <Button type="button" className="w-full rounded-full">
            {t("errors.notFound.login")}
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
