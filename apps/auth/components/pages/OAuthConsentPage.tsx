"use client";

import { AuthLayout } from "@/components/AuthLayout";
import { authClient } from "@/lib/auth/client";
import { useI18n } from "@/lib/ui/i18n";
import { Button, Spinner } from "@hosanna/ui";
import { Shield } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function OAuthConsentPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [hasUser, setHasUser] = useState(false);

  const oauthQuery = useMemo(() => searchParams.toString(), [searchParams]);
  const clientId = searchParams.get("client_id") ?? "MCP client";
  const scope = searchParams.get("scope") ?? "";

  useEffect(() => {
    let cancelled = false;
    void authClient.getSession().then((session: { data?: { user?: unknown } | null }) => {
      if (cancelled) return;
      setHasUser(Boolean(session.data?.user));
      setUserLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (!hasUser) {
      const next = encodeURIComponent(`/oauth/consent?${oauthQuery}`);
      router.replace(`/login?redirect=${next}`);
    }
  }, [userLoading, hasUser, oauthQuery, router]);

  const submit = async (accept: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/oauth2/consent", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accept,
          oauth_query: oauthQuery,
          ...(scope ? { scope } : {}),
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        redirect?: boolean;
        url?: string;
        message?: string;
      } | null;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.message || t("oauth.consent.genericError"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("oauth.consent.genericError"));
    } finally {
      setBusy(false);
    }
  };

  if (userLoading || !hasUser) {
    return (
      <AuthLayout headerTitle={t("oauth.consent.title")}>
        <Spinner size="md" label={t("common.loading")} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      headerTitle={t("oauth.consent.title")}
      headerSubtitle={t("oauth.consent.desc", { client: clientId })}
      errorMsg={error || undefined}
    >
      <div className="space-y-5">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-m3-primary/10 text-m3-primary flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        {scope && (
          <div className="rounded-md border border-m3-border bg-m3-sidebar/40 px-3 py-2.5 text-xs text-m3-text text-left">
            <span className="font-medium block mb-1 text-label">{t("oauth.consent.scopes")}</span>
            <code className="break-all font-mono text-[11px]">{scope}</code>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void submit(false)}>
            {t("oauth.consent.deny")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="rounded-full px-6"
            isLoading={busy}
            onClick={() => void submit(true)}
          >
            {t("oauth.consent.allow")}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
