"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/Button";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

function humanizeError(code: string | null, fallback: string): string {
  if (!code) return fallback;
  const normalized = code.replace(/[_-]+/g, " ").trim();
  if (!normalized) return fallback;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function AuthErrorPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();

  const errorMsg = useMemo(() => {
    const error =
      searchParams.get("error") ||
      searchParams.get("error_description") ||
      searchParams.get("message");
    return humanizeError(error, t("auth.error.generic"));
  }, [searchParams, t]);

  return (
    <AuthLayout
      headerTitle={t("auth.error.title")}
      headerSubtitle={t("auth.error.subtitle")}
      errorMsg={errorMsg}
    >
      <div className="space-y-4">
        <p className="text-body-sm text-m3-text-secondary">{t("auth.error.hint")}</p>
        <Link href="/login" className="block">
          <Button type="button" className="w-full">
            {t("auth.error.backToLogin")}
          </Button>
        </Link>
      </div>
    </AuthLayout>
  );
}
