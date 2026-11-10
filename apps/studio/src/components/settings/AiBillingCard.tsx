/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { aiApi, type AiBillingResponse } from "@/src/api/ai";
import { Button, Surface } from "@hosanna/ui";
import { useI18n } from "@/src/lib/i18n";
import { Gift, Loader2, RefreshCw, Wallet } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

export interface AiBillingCardProps {
  /** Bump after a successful save so the card refetches. */
  refreshKey?: number;
  showToast?: (text: string, variant: "success" | "error" | "info" | "warning") => void;
}

function formatMoney(amount: string, currency: string): string {
  const symbol = currency === "CNY" ? "¥" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${amount}`;
}

function formatFetchedAt(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const AiBillingCard: React.FC<AiBillingCardProps> = ({ refreshKey = 0, showToast }) => {
  const { t, locale } = useI18n();
  const [data, setData] = useState<AiBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await aiApi.getBilling();
      setData(next);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("ai.settings.billing.loadError");
      setError(message);
      setData(null);
      showToast?.(message, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  let body: React.ReactNode = null;
  if (loading && !data) {
    body = (
      <div className="flex items-center justify-center gap-2 text-m3-secondary text-sm py-8">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t("ai.settings.billing.loading")}
      </div>
    );
  } else if (error) {
    body = (
      <div className="rounded-md border border-m3-danger/25 bg-m3-danger/5 px-4 py-3">
        <p className="text-sm text-m3-danger">{error}</p>
      </div>
    );
  } else if (data?.supported === false) {
    const reasonMsg =
      data.reason === "not_configured"
        ? t("ai.settings.billing.notConfigured")
        : data.reason === "disabled_crypto"
          ? t("ai.settings.billing.cryptoMissing")
          : t("ai.settings.billing.unsupported");
    body = (
      <div className="rounded-md border border-dashed border-m3-border px-4 py-6 text-center">
        <p className="text-sm text-m3-secondary">{reasonMsg}</p>
      </div>
    );
  } else if (data?.supported === true && data.kind === "balance") {
    const primary = data.balances[0];
    body = (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-4">
          <div className="relative flex-1 min-w-0 overflow-hidden rounded-xl border border-m3-border bg-m3-sidebar/50 p-5">
            <div className="absolute inset-0 bg-linear-to-br from-m3-primary/8 via-transparent to-transparent pointer-events-none" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-caption text-m3-secondary">{t("ai.settings.billing.total")}</p>
                <p className="text-3xl sm:text-4xl font-semibold tabular-nums tracking-tight text-m3-text mt-1">
                  {primary ? formatMoney(primary.totalBalance, primary.currency) : "—"}
                </p>
                {primary ? (
                  <p className="text-caption text-m3-secondary mt-1.5">{primary.currency}</p>
                ) : null}
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 ${
                  data.isAvailable
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                }`}
              >
                {data.isAvailable
                  ? t("ai.settings.billing.available")
                  : t("ai.settings.billing.unavailable")}
              </span>
            </div>
          </div>

          {primary ? (
            <div className="grid grid-cols-2 sm:grid-cols-1 sm:w-56 shrink-0 gap-3">
              <div className="rounded-xl border border-m3-border bg-m3-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-caption text-m3-secondary">
                    {t("ai.settings.billing.granted")}
                  </p>
                </div>
                <p className="text-lg font-semibold tabular-nums text-m3-text">
                  {formatMoney(primary.grantedBalance, primary.currency)}
                </p>
              </div>
              <div className="rounded-xl border border-m3-border bg-m3-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-caption text-m3-secondary">
                    {t("ai.settings.billing.toppedUp")}
                  </p>
                </div>
                <p className="text-lg font-semibold tabular-nums text-m3-text">
                  {formatMoney(primary.toppedUpBalance, primary.currency)}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {data.balances.length > 1 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.balances.slice(1).map((b) => (
              <li
                key={b.currency}
                className="flex items-center justify-between gap-2 rounded-lg border border-m3-border/80 bg-m3-sidebar/40 px-3.5 py-2.5 text-sm"
              >
                <span className="text-m3-secondary font-medium">{b.currency}</span>
                <span className="tabular-nums font-semibold text-m3-text">
                  {formatMoney(b.totalBalance, b.currency)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="text-caption text-m3-secondary">
          {t("ai.settings.billing.refreshedAt", {
            time: formatFetchedAt(data.fetchedAt, locale),
          })}
        </p>
      </div>
    );
  }

  return (
    <Surface padding="none" className="overflow-hidden">
      <div className="px-5 py-4 border-b border-m3-border flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-m3-text">{t("ai.settings.billing.title")}</h3>
            <p className="text-caption text-m3-secondary mt-0.5">{t("ai.settings.billing.desc")}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={t("ai.settings.billing.refresh")}
          isLoading={loading}
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={() => void load()}
          disabled={loading}
        />
      </div>

      <div className="p-5">{body}</div>
    </Surface>
  );
};
