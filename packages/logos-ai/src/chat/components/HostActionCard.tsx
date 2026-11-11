/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Optional open/print offer for thin hosts — chat stays put until the user clicks.
 */

import { Button } from "@hosanna/ui";
import { Compass, ExternalLink, Printer } from "lucide-react";
import React, { useState } from "react";
import type { DeferredHostOffer } from "../../actions/types";
import { useLogosHost, useLogosI18n } from "../../host";
import { musicAppId, planningAppId } from "../../host/capabilities";
import { useProposalActions } from "../../proposals/actions";

function targetAppLabel(offer: DeferredHostOffer, host: ReturnType<typeof useLogosHost>): string {
  if (offer.type === "print") return musicAppId(host.profile);
  const kind = offer.navigate.kind;
  if (kind === "service" || kind === "services" || kind === "agenda") {
    return planningAppId(host.profile);
  }
  return musicAppId(host.profile);
}

export const AiHostActionCard: React.FC<{ offer: DeferredHostOffer }> = ({ offer }) => {
  const { t } = useLogosI18n();
  const host = useLogosHost();
  const { runHostUiOffer } = useProposalActions();
  const [done, setDone] = useState(false);
  const app = targetAppLabel(offer, host);

  const kind = offer.type === "print" ? offer.print.kind : offer.navigate.kind;
  const title =
    offer.type === "print"
      ? t("ai.chat.hostAction.printTitle", { app })
      : t("ai.chat.hostAction.openTitle", { app });

  const detail =
    offer.type === "print"
      ? offer.print.title ||
        t("ai.chat.hostAction.printDetail", {
          kind,
          count: offer.print.ids.length,
        })
      : [kind, offer.navigate.id || offer.navigate.route].filter(Boolean).join(" · ") ||
        t("ai.chat.hostAction.openDetail", { kind });

  const Icon = offer.type === "print" ? Printer : Compass;

  if (done) {
    return (
      <div className="my-1.5 rounded-md border border-m3-border/70 bg-m3-card/60 px-2.5 py-2 text-[11px] text-m3-secondary">
        {t("ai.chat.hostAction.opened")}
      </div>
    );
  }

  return (
    <div className="my-1.5 rounded-md border border-m3-border bg-m3-card overflow-hidden">
      <div className="flex items-start gap-2 px-2.5 py-2">
        <Icon className="w-3.5 h-3.5 text-m3-secondary shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[12px] font-semibold text-m3-text">{title}</p>
          <p className="m-0 text-[11px] text-m3-secondary truncate">{detail}</p>
          <p className="m-0 mt-0.5 text-[10.5px] text-m3-secondary">
            {t("ai.chat.hostAction.optionalHint")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 pb-2">
        <Button
          variant="outline"
          size="sm"
          icon={<ExternalLink className="w-3.5 h-3.5" />}
          onClick={() => {
            runHostUiOffer(offer);
            setDone(true);
          }}
        >
          {offer.type === "print"
            ? t("ai.chat.hostAction.openToPrint", { app })
            : t("ai.chat.hostAction.open", { app })}
        </Button>
      </div>
    </div>
  );
};
