"use client";

import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import {
  readCachedAccounts,
  writeCachedAccounts,
  type CachedSocialAccount,
} from "@/lib/session-cache";
import { ConfirmDialog, GoogleIcon, Surface } from "@hosanna/ui";
import { CheckCircle2, ExternalLink, Link2, Loader2, RefreshCw, Unlink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type UserAccount = CachedSocialAccount;

export function SocialAccountsSection({ onToast }: { onToast: (msg: string, type: "success" | "error") => void }) {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<UserAccount[]>(() => readCachedAccounts() ?? []);
  const [isLoading, setIsLoading] = useState(() => readCachedAccounts() === null);
  const [isRefreshing, setIsRefreshing] = useState(() => readCachedAccounts() !== null);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  const fetchAccounts = useCallback(async (opts?: { background?: boolean }) => {
    const hasCache = readCachedAccounts() !== null;
    const background = Boolean(opts?.background && hasCache);
    if (background) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const { data, error } = await authClient.listAccounts({ query: {} });
      const next =
        !error && data
          ? (data as unknown as UserAccount[]).map((a) => ({
              id: a.id,
              providerId: a.providerId,
              accountId: a.accountId,
            }))
          : [];
      writeCachedAccounts(next);
      setAccounts(next);
    } catch {
      if (!background) {
        setAccounts([]);
        writeCachedAccounts([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAccounts({ background: true });
  }, [fetchAccounts]);

  const linked = accounts.find((a) => a.providerId.toLowerCase() === "google");

  const handleLink = async () => {
    setLinkingProvider("google");
    try {
      await authClient.linkSocial({
        provider: "google",
        callbackURL: window.location.href,
      });
    } catch (err: unknown) {
      onToast(
        t("settings.account.socialAccounts.linkError", {
          error: (err as Error)?.message || "Error",
        }),
        "error",
      );
      setLinkingProvider(null);
    }
  };

  const handleUnlink = async () => {
    if (!linked) return;
    setUnlinkingProvider("google");
    try {
      const { error } = await authClient.unlinkAccount({
        accountId: linked.accountId || linked.id,
      });
      if (error) {
        onToast(
          t("settings.account.socialAccounts.unlinkError", {
            error: error.message || "Error",
          }),
          "error",
        );
      } else {
        onToast(t("settings.account.socialAccounts.unlinkSuccess"), "success");
        await fetchAccounts();
      }
    } catch (err: unknown) {
      onToast(
        t("settings.account.socialAccounts.unlinkError", {
          error: (err as Error)?.message || "Error",
        }),
        "error",
      );
    } finally {
      setUnlinkingProvider(null);
      setConfirmUnlink(false);
    }
  };

  return (
    <Surface>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-title text-m3-text flex items-center gap-2">
            <Link2 className="w-4 h-4 text-m3-primary" />
            {t("settings.account.socialAccounts.title")}
          </h3>
          <p className="text-muted mt-0.5">{t("settings.account.socialAccounts.desc")}</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchAccounts()}
          disabled={isLoading || isRefreshing}
          className="p-1.5 text-m3-secondary hover:text-m3-text rounded-lg hover:bg-m3-hover transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading || isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-m3-secondary flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />
          {t("settings.account.socialAccounts.loading")}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-m3-border/80 bg-m3-sidebar/50 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-m3-card border border-m3-border flex items-center justify-center shadow-xs shrink-0">
              <GoogleIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-m3-text">Google</span>
                {linked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                    <CheckCircle2 className="w-3 h-3" />
                    {t("settings.account.socialAccounts.connected")}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-m3-secondary">
                    {t("settings.account.socialAccounts.notConnected")}
                  </span>
                )}
              </div>
              <p className="text-xs text-m3-secondary mt-0.5">
                {t("settings.account.socialAccounts.googleDesc")}
              </p>
            </div>
          </div>
          {linked ? (
            <button
              type="button"
              disabled={unlinkingProvider !== null}
              onClick={() => setConfirmUnlink(true)}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {unlinkingProvider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
              <span>{t("settings.account.socialAccounts.disconnect")}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={linkingProvider !== null}
              onClick={() => void handleLink()}
              className="px-3 py-1.5 text-xs font-semibold text-m3-primary hover:bg-m3-primary/10 rounded-lg border border-m3-primary/30 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {linkingProvider ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              <span>{t("settings.account.socialAccounts.connect")}</span>
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmUnlink}
        onClose={() => setConfirmUnlink(false)}
        onConfirm={() => void handleUnlink()}
        title={t("settings.account.socialAccounts.unlinkConfirmTitle")}
        message={t("settings.account.socialAccounts.unlinkConfirmMessage", { provider: "Google" })}
        confirmText={t("settings.account.socialAccounts.disconnect")}
        cancelText={t("common.cancel")}
        isLoading={unlinkingProvider !== null}
      />
    </Surface>
  );
}
