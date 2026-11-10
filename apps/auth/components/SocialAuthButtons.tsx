"use client";

import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n";
import { resolveSocialCallbackURL } from "@/lib/redirect";
import { AppleIcon, DiscordIcon, GitHubIcon, GoogleIcon, MicrosoftIcon } from "@hosanna/ui";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";

export type SocialProviderId =
  | "google"
  | "github"
  | "apple"
  | "microsoft"
  | "discord"
  | (string & {});

export interface SocialProviderOption {
  id: SocialProviderId;
  name: string;
  icon: React.FC<{ className?: string }>;
  enabled?: boolean;
}

export const DEFAULT_LOGIN_PROVIDERS: SocialProviderOption[] = [
  { id: "google", name: "Google", icon: GoogleIcon, enabled: true },
  { id: "github", name: "GitHub", icon: GitHubIcon, enabled: false },
  { id: "apple", name: "Apple", icon: AppleIcon, enabled: false },
  { id: "microsoft", name: "Microsoft", icon: MicrosoftIcon, enabled: false },
  { id: "discord", name: "Discord", icon: DiscordIcon, enabled: false },
];

interface SocialAuthButtonsProps {
  providers?: SocialProviderOption[];
  onError?: (error: string) => void;
  disabled?: boolean;
  callbackURL?: string;
  showDivider?: boolean;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  providers = DEFAULT_LOGIN_PROVIDERS,
  onError,
  disabled = false,
  callbackURL,
  showDivider = true,
}) => {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const activeProviders = providers.filter((p) => p.enabled !== false);
  if (activeProviders.length === 0) return null;

  const handleSocialSignIn = async (providerId: SocialProviderId) => {
    setLoadingProvider(providerId);
    onError?.("");

    try {
      const fullCallbackUrl = resolveSocialCallbackURL(searchParams, callbackURL);

      await authClient.signIn.social({
        provider: providerId as "google",
        callbackURL: fullCallbackUrl,
        errorCallbackURL: `${window.location.origin}/auth/error`,
      });
    } catch (err: unknown) {
      const message = (err as Error)?.message || t("auth.login.errorGeneric");
      onError?.(message);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="w-full mt-6">
      {showDivider && (
        <div className="relative flex items-center justify-center my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-m3-border" />
          </div>
          <div className="relative px-3 bg-m3-card text-caption">
            {t("auth.login.orContinueWith")}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {activeProviders.map((provider) => {
          const Icon = provider.icon;
          const isLoading = loadingProvider === provider.id;

          return (
            <button
              key={provider.id}
              type="button"
              disabled={disabled || loadingProvider !== null}
              onClick={() => void handleSocialSignIn(provider.id)}
              className="w-full h-14 px-4 rounded-full border border-m3-border bg-m3-card hover:bg-m3-hover text-m3-text font-medium text-[15px] transition-colors flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-m3-secondary" aria-hidden="true" />
              ) : (
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" aria-hidden="true" />
              )}
              <span>
                {provider.id === "google"
                  ? t("auth.login.continueWithGoogle")
                  : `${t("auth.login.continueWith")} ${provider.name}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
