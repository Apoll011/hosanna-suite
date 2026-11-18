"use client";

import { authClient } from "@/lib/auth/client";
import { useI18n } from "@/lib/ui/i18n";
import { InboxButton } from "@hosanna/ui";

export function AuthInboxButton() {
  const { language } = useI18n();
  return <InboxButton client={authClient} language={language} className="shrink-0" />;
}
