/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * In-chat service proposal card — Accept/Decline works on any host via catalog API.
 * Opening Planning/Music is optional.
 */

import { Button } from "@hosanna/ui";
import { CalendarDays, Check, CircleSlash, ExternalLink, X } from "lucide-react";
import React, { memo, useMemo, useState } from "react";
import { useLogosHost, useLogosI18n } from "../../host";
import { useCatalogService } from "../../host/catalog";
import { hasCapability, planningAppId } from "../../host/capabilities";
import { useProposalActions } from "../actions";
import { useServiceProposal, useServiceProposalStatus, type ServiceProposal } from "../store";
import { useOpenEditorKey } from "../hooks/useOpenEditorKey";
import type { LogosServiceElement } from "../../host/types";

export type AiServiceProposalPayload = {
  id: string;
  elements: LogosServiceElement[];
  name?: string;
  notes?: string;
};

export const AiServiceProposalCard: React.FC<{ proposal: AiServiceProposalPayload }> = memo(
  function AiServiceProposalCard({ proposal }) {
    const { t, tc } = useLogosI18n();
    const host = useLogosHost();
    const canUpdate = host.canUpdateService;
    const hasLocalEditor = hasCapability(host.profile, "editor.services");
    const status = useServiceProposalStatus(proposal.id, proposal.elements);
    const stored = useServiceProposal(proposal.id);
    const openKey = useOpenEditorKey();
    const {
      data: service,
      isLoading,
      notFound,
    } = useCatalogService(status === "pending" ? proposal.id : null);
    const { applyService, decline, openInEditor } = useProposalActions();
    const [busy, setBusy] = useState(false);
    const [applyError, setApplyError] = useState<string | null>(null);

    const inEditor = openKey === `service:${proposal.id}`;
    const title = proposal.name || service?.name || t("ai.chat.proposals.untitled");
    const live: ServiceProposal | null =
      stored && JSON.stringify(stored.elements) === JSON.stringify(proposal.elements)
        ? stored
        : null;
    const openLabel = hasLocalEditor
      ? t("ai.chat.proposals.openEditor")
      : t("ai.chat.proposals.openInMusic", { app: planningAppId(host.profile) });

    const summary = useMemo(() => {
      const count = proposal.elements.length;
      const songs = proposal.elements.filter((el) => el.type === "song").length;
      return { count, songs };
    }, [proposal.elements]);

    const accept = async () => {
      if (!live) return;
      setBusy(true);
      setApplyError(null);
      try {
        const ok = await applyService(live);
        if (!ok) setApplyError(t("ai.chat.proposals.applyFailed"));
      } finally {
        setBusy(false);
      }
    };

    const statusLine =
      status === "accepted"
        ? {
            icon: Check,
            text: t("ai.chat.proposals.statusApplied"),
            tone: "text-m3-success",
          }
        : status === "declined"
          ? {
              icon: X,
              text: t("ai.chat.proposals.statusDeclined"),
              tone: "text-m3-secondary",
            }
          : {
              icon: CircleSlash,
              text: t("ai.chat.proposals.statusStale"),
              tone: "text-m3-secondary",
            };

    return (
      <div className="logos-msg-in mt-1.5 rounded-lg border border-m3-primary/30 bg-m3-card overflow-hidden">
        <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-m3-border/70">
          <CalendarDays className="w-3.5 h-3.5 text-m3-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-semibold text-m3-text truncate">{title}</p>
            <p className="m-0 text-[10.5px] text-m3-secondary truncate">
              {tc("ai.chat.proposals.serviceElements", summary.count)}
              {summary.songs > 0 ? ` · ${tc("ai.chat.proposals.serviceSongs", summary.songs)}` : ""}
            </p>
          </div>
          {status !== "pending" && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium shrink-0 ${statusLine.tone}`}
            >
              <statusLine.icon className="w-3.5 h-3.5" />
              {statusLine.text}
            </span>
          )}
        </div>

        {status === "pending" && (
          <>
            {inEditor ? (
              <p className="m-0 px-3 py-2 text-[11.5px] text-m3-secondary">
                {t("ai.chat.proposals.inEditorNoteService")}
              </p>
            ) : isLoading ? (
              <p className="m-0 px-3 py-2 text-[11.5px] text-m3-secondary">
                {t("ai.chat.proposals.loadingService")}
              </p>
            ) : notFound || !service ? (
              <p className="m-0 px-3 py-2 text-[11.5px] text-m3-secondary">
                {t("ai.chat.proposals.serviceGone")}
              </p>
            ) : (
              <ul className="m-0 px-3 py-2 list-none space-y-0.5 max-h-36 overflow-y-auto">
                {proposal.elements.slice(0, 12).map((el, i) => (
                  <li
                    key={el.id || `${el.type}-${i}`}
                    className="text-[11px] text-m3-text truncate"
                  >
                    <span className="text-m3-secondary">{el.type}</span>
                    {" · "}
                    {el.title || t("ai.chat.proposals.untitled")}
                  </li>
                ))}
                {proposal.elements.length > 12 ? (
                  <li className="text-[10.5px] text-m3-secondary">
                    {t("ai.chat.proposals.moreItems", {
                      count: proposal.elements.length - 12,
                    })}
                  </li>
                ) : null}
              </ul>
            )}

            {applyError ? (
              <p className="m-0 px-3 pb-1 text-[11px] text-m3-danger">{applyError}</p>
            ) : null}

            <div className="flex items-center gap-1.5 px-2 py-1.5 border-t border-m3-border/70 bg-m3-sidebar/40">
              {live && !inEditor && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] text-m3-secondary hover:text-m3-text px-1.5 py-1 rounded-sm hover:bg-m3-hover"
                  onClick={() => openInEditor(live)}
                  title={openLabel}
                >
                  <ExternalLink className="w-3 h-3" />
                  {openLabel}
                </button>
              )}
              <span className="flex-1" />
              {live && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<X className="w-3.5 h-3.5" />}
                  disabled={busy}
                  onClick={() => decline(live)}
                >
                  {t("ai.chat.decline")}
                </Button>
              )}
              {live && !inEditor && canUpdate && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Check className="w-3.5 h-3.5" />}
                  disabled={busy || !service}
                  onClick={() => void accept()}
                >
                  {t("ai.chat.accept")}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    );
  },
);
