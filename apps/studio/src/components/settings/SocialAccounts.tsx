/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfirmDialog } from "@/src/components/common";
import {
  AppleIcon,
  DiscordIcon,
  GitHubIcon,
  GoogleIcon,
  MicrosoftIcon,
} from "@/src/components/icons/SocialIcons";
import { useSync } from "@/src/contexts/SyncContext";
import { authClient } from "@/src/lib/authClient";
import { useI18n } from "@/src/lib/i18n";
import {
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  RefreshCw,
  Unlink,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

export type SocialProviderId =
  "google" | "github" | "apple" | "microsoft" | "discord" | (string & {});

export interface SocialProviderConfig {
  id: SocialProviderId;
  name: string;
  icon: React.FC<{ className?: string }>;
  description?: string;
  enabled: boolean;
}

/**
 * Modular list of supported social providers.
 * You can enable or add new social providers here anytime.
 */
export const SUPPORTED_SOCIAL_PROVIDERS: SocialProviderConfig[] = [
  {
    id: "google",
    name: "Google",
    icon: GoogleIcon,
    description: "settings.account.socialAccounts.googleDesc",
    enabled: true,
  },
  {
    id: "github",
    name: "GitHub",
    icon: GitHubIcon,
    description: "settings.account.socialAccounts.githubDesc",
    enabled: false,
  },
  {
    id: "apple",
    name: "Apple",
    icon: AppleIcon,
    description: "settings.account.socialAccounts.appleDesc",
    enabled: false,
  },
  {
    id: "microsoft",
    name: "Microsoft",
    icon: MicrosoftIcon,
    description: "settings.account.socialAccounts.microsoftDesc",
    enabled: false,
  },
  {
    id: "discord",
    name: "Discord",
    icon: DiscordIcon,
    description: "settings.account.socialAccounts.discordDesc",
    enabled: false,
  },
];

interface UserAccount {
  id: string;
  providerId: string;
  accountId: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface SocialAccountsSectionProps {
  customProviders?: SocialProviderConfig[];
}

export const SocialAccountsSection: React.FC<SocialAccountsSectionProps> = ({
  customProviders,
}) => {
  const { showToast } = useSync();
  const { t } = useI18n();

  const providers = customProviders || SUPPORTED_SOCIAL_PROVIDERS;
  const activeProviders = providers.filter((p) => p.enabled !== false);

  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(
    null,
  );
  const [providerToUnlink, setProviderToUnlink] =
    useState<SocialProviderConfig | null>(null);

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.listAccounts({ query: {} });
      if (!error && data) {
        setAccounts(data as unknown as UserAccount[]);
      } else {
        setAccounts([]);
      }
    } catch {
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  const handleLink = async (provider: SocialProviderConfig) => {
    setLinkingProvider(provider.id);
    try {
      await authClient.linkSocial({
        provider: provider.id as "google",
        callbackURL: window.location.href,
      });
    } catch (err: unknown) {
      showToast(
        t("settings.account.socialAccounts.linkError", {
          error: (err as Error)?.message || "Erro ao associar conta",
        }),
        "error",
      );
      setLinkingProvider(null);
    }
  };

  const handleConfirmUnlink = async () => {
    if (!providerToUnlink) return;
    const providerId = providerToUnlink.id;
    const matchedAccount = accounts.find(
      (a) => a.providerId.toLowerCase() === providerId.toLowerCase(),
    );

    if (!matchedAccount) {
      setProviderToUnlink(null);
      return;
    }

    setUnlinkingProvider(providerId);
    try {
      const { error } = await authClient.unlinkAccount({
        accountId: matchedAccount.accountId || matchedAccount.id,
      });

      if (error) {
        showToast(
          t("settings.account.socialAccounts.unlinkError", {
            error: error.message || "Erro ao desassociar conta",
          }),
          "error",
        );
      } else {
        showToast(
          t("settings.account.socialAccounts.unlinkSuccess"),
          "success",
        );
        await fetchAccounts();
      }
    } catch (err: unknown) {
      showToast(
        t("settings.account.socialAccounts.unlinkError", {
          error: (err as Error)?.message || "Erro de rede",
        }),
        "error",
      );
    } finally {
      setUnlinkingProvider(null);
      setProviderToUnlink(null);
    }
  };

  if (activeProviders.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-slate-400" />
            {t("settings.account.socialAccounts.title")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t("settings.account.socialAccounts.desc")}
          </p>
        </div>
        <button
          onClick={() => void fetchAccounts()}
          disabled={isLoading}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          title={t("settings.account.activeSessions.refreshTitle")}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-m3-primary" />
          {t("settings.account.socialAccounts.loading")}
        </div>
      ) : (
        <div className="space-y-3">
          {activeProviders.map((provider) => {
            const Icon = provider.icon;
            const linkedAccount = accounts.find(
              (a) => a.providerId.toLowerCase() === provider.id.toLowerCase(),
            );
            const isConnected = !!linkedAccount;
            const isLinking = linkingProvider === provider.id;
            const isUnlinking = unlinkingProvider === provider.id;

            return (
              <div
                key={provider.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {provider.name}
                      </span>
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" />
                          {t("settings.account.socialAccounts.connected")}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          {t("settings.account.socialAccounts.notConnected")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {provider.id === "google"
                        ? t("settings.account.socialAccounts.googleDesc")
                        : t("settings.account.socialAccounts.providerDesc", {
                            name: provider.name,
                          })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {isConnected ? (
                    <button
                      type="button"
                      disabled={isUnlinking}
                      onClick={() => setProviderToUnlink(provider)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isUnlinking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Unlink className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {t("settings.account.socialAccounts.disconnect")}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isLinking}
                      onClick={() => void handleLink(provider)}
                      className="px-3 py-1.5 text-xs font-semibold text-m3-primary hover:text-m3-primary-dark dark:text-m3-primary-light hover:bg-m3-primary/10 rounded-lg border border-m3-primary/30 dark:border-m3-primary/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isLinking ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {t("settings.account.socialAccounts.connect")}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unlink Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!providerToUnlink}
        onClose={() => setProviderToUnlink(null)}
        onConfirm={handleConfirmUnlink}
        title={t("settings.account.socialAccounts.unlinkConfirmTitle")}
        message={t("settings.account.socialAccounts.unlinkConfirmMessage", {
          provider: providerToUnlink?.name || "Social",
        })}
        confirmText={t("settings.account.socialAccounts.disconnect")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={unlinkingProvider !== null}
      />
    </div>
  );
};
