"use client";

import { AccountCenter } from "@/components/account/AccountCenter";
import { useI18n } from "@/lib/ui/i18n";
import type { TranslationKey } from "@/lib/ui/i18n";
import { PageHeader, Surface } from "@hosanna/ui";

/** Shared stub shell for org subpages — content agents replace the Surface body. */
export function OrgComingSoon({
  titleKey,
  descriptionKey,
}: {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}) {
  const { t } = useI18n();
  return (
    <AccountCenter>
      <PageHeader title={t(titleKey)} description={t(descriptionKey)} />
      <Surface>
        <p className="text-sm text-m3-secondary">{t("accountOrg.comingSoon")}</p>
      </Surface>
    </AccountCenter>
  );
}
