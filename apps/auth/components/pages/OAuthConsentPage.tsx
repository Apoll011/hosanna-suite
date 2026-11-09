"use client";

import { Button } from "@/components/Button";
import { authClient } from "@/lib/auth-client";
import { useLocale } from "@/lib/locale";
import { Loader2, Shield } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function OAuthConsentPage() {
  const { t } = useLocale();
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

  if (userLoading || !hasUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-m3-bg">
        <Loader2 className="w-6 h-6 animate-spin text-m3-primary" />
      </div>
    );
  }

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-m3-bg p-4">
      <div className="w-full max-w-md p-6 space-y-5 rounded-2xl border border-m3-border bg-m3-card shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-m3-primary/10 text-m3-primary flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-title text-m3-text">{t("oauth.consent.title")}</h1>
            <p className="text-sm text-m3-secondary mt-1">
              {t("oauth.consent.desc", { client: clientId })}
            </p>
          </div>
        </div>

        {scope && (
          <div className="rounded-md border border-m3-border bg-m3-sidebar/40 px-3 py-2 text-xs text-m3-text">
            <span className="font-medium block mb-1">{t("oauth.consent.scopes")}</span>
            <code className="break-all">{scope}</code>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void submit(false)}>
            {t("oauth.consent.deny")}
          </Button>
          <Button variant="primary" size="sm" isLoading={busy} onClick={() => void submit(true)}>
            {t("oauth.consent.allow")}
          </Button>
        </div>
      </div>
    </div>
  );
}
