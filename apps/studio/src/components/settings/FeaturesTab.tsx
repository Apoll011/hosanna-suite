/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useI18n } from "@/src/lib/i18n";
import { posthog } from "@/src/lib/posthog";
import { renderHtml } from "@tanstack/markdown/html";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Bug,
  ChevronRight,
  ExternalLink,
  FlaskConical,
  HelpCircle,
  Inbox,
  Loader2,
  Lock,
  MailCheck,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { EarlyAccessFeature, Message, Ticket } from "posthog-js";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface FeaturesTabProps {
  active: boolean;
}

/* ─── Section heading ─────────────────────────────────────────────── */
const SectionHeading: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle: string;
}> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="mt-0.5 p-2 rounded-xl bg-m3-primary/10 text-m3-primary">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        {subtitle}
      </p>
    </div>
  </div>
);

const ErrorNote: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-[11px]">
    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
    {message}
  </div>
);

/* ─── Early-Access Panel ──────────────────────────────────────────── */
// Concept-stage features never flip their linked feature flag (see PostHog's
// early-access lifecycle: Draft/Concept never enable the flag), so we can't
// use isFeatureEnabled() to know if the user registered interest. We track
// that locally instead.
const INTEREST_STORAGE_KEY = "ph_eaf_interest_registered";

const readLocalInterest = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(INTEREST_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeLocalInterest = (state: Record<string, boolean>) => {
  try {
    localStorage.setItem(INTEREST_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
};

const EarlyAccessPanel: React.FC = () => {
  const { t } = useI18n();
  const [activeFeatures, setActiveFeatures] = useState<EarlyAccessFeature[]>(
    [],
  );
  const [conceptFeatures, setConceptFeatures] = useState<EarlyAccessFeature[]>(
    [],
  );
  const [enrolled, setEnrolled] = useState<Record<string, boolean>>({});
  const [interested, setInterested] =
    useState<Record<string, boolean>>(readLocalInterest);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!posthog) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      posthog.getEarlyAccessFeatures(
        (feats) => {
          const active = feats.filter((f) =>
            ["alpha", "beta"].includes(f.stage),
          );
          const concept = feats.filter((f) => f.stage === "concept");
          setActiveFeatures(active);
          setConceptFeatures(concept);

          const state: Record<string, boolean> = {};
          active.forEach((f) => {
            if (!f.flagKey) return;
            state[f.flagKey] = posthog!.isFeatureEnabled(f.flagKey) || false;
          });
          setEnrolled(state);
          setLoading(false);
        },
        true,
        ["concept", "alpha", "beta"],
      );
    } catch {
      setError(t("settings.features.earlyAccess.loadError"));
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleEnrolled = (flagKey: string) => {
    const next = !enrolled[flagKey];
    posthog?.updateEarlyAccessFeatureEnrollment(flagKey, next);
    // Enrollment changes an overriding condition on the linked flag —
    // refresh flags so the rest of the app sees the change immediately.
    posthog?.reloadFeatureFlags();
    setEnrolled((prev) => ({ ...prev, [flagKey]: next }));
  };

  const toggleInterest = (flagKey: string) => {
    const next = !interested[flagKey];
    posthog?.updateEarlyAccessFeatureEnrollment(flagKey, next);
    setInterested((prev) => {
      const updated = { ...prev, [flagKey]: next };
      writeLocalInterest(updated);
      return updated;
    });
  };

  const renderFeatureRow = (
    feat: EarlyAccessFeature,
    on: boolean,
    onToggle: () => void,
    enrolledLabel: string,
  ) => (
    <li
      key={feat.flagKey}
      className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {feat.name}
          </span>
          <span className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-m3-primary/10 text-m3-primary">
            {feat.stage}
          </span>
          {on && (
            <span className="text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {enrolledLabel}
            </span>
          )}
        </div>
        {feat.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {feat.description}
          </p>
        )}
        {feat.documentationUrl && (
          <a
            href={feat.documentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-m3-primary mt-1 hover:underline"
          >
            {t("settings.features.earlyAccess.docs")}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <button
        onClick={onToggle}
        aria-label={on ? "Disable" : "Enable"}
        className="shrink-0 mt-0.5 transition-colors"
      >
        {on ? (
          <ToggleRight className="w-6 h-6 text-m3-primary" />
        ) : (
          <ToggleLeft className="w-6 h-6 text-slate-400" />
        )}
      </button>
    </li>
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <SectionHeading
          icon={FlaskConical}
          title={t("settings.features.earlyAccess.title")}
          subtitle={t("settings.features.earlyAccess.subtitle")}
        />
        <button
          onClick={load}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {!posthog ? (
        <p className="text-xs text-slate-400 py-2">
          {t("settings.features.earlyAccess.unavailable")}
        </p>
      ) : loading ? (
        <div className="flex items-center gap-2 py-4 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("common.loading")}…
        </div>
      ) : error ? (
        <ErrorNote message={error} />
      ) : activeFeatures.length === 0 && conceptFeatures.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">
          {t("settings.features.earlyAccess.empty")}
        </p>
      ) : (
        <div className="space-y-5">
          {activeFeatures.length > 0 && (
            <ul className="space-y-2">
              {activeFeatures
                .filter((f) => !!f.flagKey)
                .map((feat) =>
                  renderFeatureRow(
                    feat,
                    enrolled[feat.flagKey!] ?? false,
                    () => toggleEnrolled(feat.flagKey!),
                    t("settings.features.earlyAccess.enrolled"),
                  ),
                )}
            </ul>
          )}

          {conceptFeatures.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {t("settings.features.earlyAccess.comingSoon")}
              </p>
              <ul className="space-y-2">
                {conceptFeatures
                  .filter((f) => !!f.flagKey)
                  .map((feat) =>
                    renderFeatureRow(
                      feat,
                      interested[feat.flagKey!] ?? false,
                      () => toggleInterest(feat.flagKey!),
                      t("settings.features.earlyAccess.interested"),
                    ),
                  )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Support Panel ───────────────────────────────────────────────── */
type SupportView = "tickets" | "chat" | "restore";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  open: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  on_hold: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  resolved: "bg-slate-200 dark:bg-slate-700 text-slate-500",
};

const stripMarkdown = (text: string): string =>
  text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();

const SupportPanel: React.FC = () => {
  const { t } = useI18n();

  // `isAvailable()` can flip from false -> true asynchronously once the
  // conversations module finishes loading, so this must be state, not a
  // one-off computed const, or the panel can get stuck "unavailable".
  const [available, setAvailable] = useState(
    () => posthog?.conversations?.isAvailable() ?? false,
  );

  const [view, setView] = useState<SupportView>("tickets");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketCount, setTicketCount] = useState(0);
  const [activeTicketId, setActiveTicketId] = useState<string | undefined>();
  // Distinguishes "compose a brand-new conversation" from "viewing an
  // existing ticket with id === undefined isn't a thing" — without this the
  // app previously loaded stale messages from the last active ticket into
  // what was supposed to be a fresh chat.
  const [isNewChat, setIsNewChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [restoreEmail, setRestoreEmail] = useState("");
  const [restoreSent, setRestoreSent] = useState(false);
  const [restoreSending, setRestoreSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Poll until the conversations module finishes loading (per PostHog's
  // recommended pattern for custom UIs).
  useEffect(() => {
    if (!posthog || available) return;
    const interval = setInterval(() => {
      if (posthog!.conversations?.isAvailable()) {
        setAvailable(true);
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [available]);

  const loadTickets = useCallback(async () => {
    if (!available) return;
    setLoadingTickets(true);
    setError(null);
    try {
      const res = await posthog!.conversations!.getTickets({ limit: 20 });
      setTickets(res?.results ?? []);
      setTicketCount(res?.count ?? 0);
    } catch {
      setError(t("settings.features.support.loadError"));
    } finally {
      setLoadingTickets(false);
    }
  }, [available, t]);

  useEffect(() => {
    if (view === "tickets") loadTickets();
  }, [view, loadTickets]);

  // Handle recovery-link emails (`?ph_conv_restore=...`). The default widget
  // does this automatically; a custom UI has to call it explicitly.
  useEffect(() => {
    if (!available) return;
    (async () => {
      try {
        const result = await posthog!.conversations!.restoreFromUrlToken();
        if (result?.migrated_ticket_ids?.length) {
          await loadTickets();
        }
      } catch {
        // No restore token present, or the link expired — nothing to do.
      }
    })();
  }, [available, loadTickets]);

  const loadMessages = useCallback(
    async (ticketId?: string, silent = false) => {
      if (!available) return;
      if (!silent) setLoadingMsgs(true);
      try {
        const res = await posthog!.conversations!.getMessages(ticketId);
        // Never surface internal team notes to the customer.
        setMessages((res?.messages ?? []).filter((m) => !m.is_private));
        await posthog!.conversations!.markAsRead(ticketId);
      } catch {
        if (!silent) setError(t("settings.features.support.loadError"));
      } finally {
        if (!silent) setLoadingMsgs(false);
      }
    },
    [available, t],
  );

  // Only load/poll messages for a real, existing ticket. A brand-new,
  // not-yet-sent conversation has nothing to fetch — fetching here used to
  // pull in the previous ticket's messages by mistake.
  useEffect(() => {
    if (view === "chat" && activeTicketId) loadMessages(activeTicketId);
  }, [view, activeTicketId, loadMessages]);

  useEffect(() => {
    if (view !== "chat" || !activeTicketId) return;
    const interval = setInterval(() => {
      loadMessages(activeTicketId, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [view, activeTicketId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openTicket = (id: string) => {
    setActiveTicketId(id);
    setIsNewChat(false);
    setMessages([]);
    setError(null);
    setView("chat");
  };

  const startNewChat = (prefill = "") => {
    setActiveTicketId(undefined);
    setIsNewChat(true);
    setMessages([]);
    setDraft(prefill);
    setError(null);
    setView("chat");
  };

  // The JS SDK can only send to the "current active ticket" or force a
  // brand-new one — there's no way to target an arbitrary older ticket. So
  // if we're viewing a ticket that isn't the SDK's current one, replying
  // here would silently misfile the message into the wrong conversation.
  const currentTicketId = posthog?.conversations?.getCurrentTicketId();
  const canReply =
    isNewChat || (!!activeTicketId && activeTicketId === currentTicketId);

  const sendMsg = async () => {
    if (!draft.trim() || sending || !canReply) return;
    setSending(true);
    setError(null);
    try {
      const res = await posthog!.conversations!.sendMessage(
        draft.trim(),
        undefined,
        isNewChat,
      );
      if (!res) {
        setError(t("settings.features.support.sendError"));
        return;
      }
      setActiveTicketId(res.ticket_id);
      setIsNewChat(false);
      setDraft("");
      await loadMessages(res.ticket_id);
    } catch {
      setError(t("settings.features.support.sendError"));
    } finally {
      setSending(false);
    }
  };

  const sendRestore = async () => {
    if (!restoreEmail.trim()) return;
    setRestoreSending(true);
    setError(null);
    try {
      await posthog!.conversations!.requestRestoreLink(restoreEmail.trim());
      setRestoreSent(true);
    } catch (err) {
      const errObj = err as
        { message?: string; status?: number } | null | undefined;
      setError(
        errObj?.message?.includes("Too many requests") || errObj?.status === 429
          ? t("settings.features.support.restoreRateLimited")
          : t("settings.features.support.restoreError"),
      );
    } finally {
      setRestoreSending(false);
    }
  };

  if (!posthog) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <SectionHeading
          icon={HelpCircle}
          title={t("settings.features.support.title")}
          subtitle={t("settings.features.support.subtitle")}
        />
        <p className="text-xs text-slate-400 py-2">
          {t("settings.features.support.unavailable")}
        </p>
      </div>
    );
  }

  if (!available) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <SectionHeading
          icon={HelpCircle}
          title={t("settings.features.support.title")}
          subtitle={t("settings.features.support.subtitle")}
        />
        <div className="flex items-center gap-2 py-4 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("common.loading")}…
        </div>
      </div>
    );
  }

  const headerSubtitle =
    view === "chat"
      ? activeTicketId
        ? `#${activeTicketId}`
        : t("settings.features.support.newTicket")
      : view === "restore"
        ? t("settings.features.support.restore")
        : t("settings.features.support.subtitle");

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-2 px-5 pt-5 pb-3">
        {view !== "tickets" && (
          <button
            onClick={() => setView("tickets")}
            className="p-1 mt-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <SectionHeading
            icon={HelpCircle}
            title={t("settings.features.support.title")}
            subtitle={headerSubtitle}
          />
        </div>
        {view === "tickets" && (
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={() => startNewChat()}
              title={t("settings.features.support.newTicket")}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("restore")}
              title={t("settings.features.support.restore")}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <MailCheck className="w-4 h-4" />
            </button>
            <button
              onClick={loadTickets}
              title="Refresh"
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingTickets ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="px-5 pb-3">
          <ErrorNote message={error} />
        </div>
      )}

      {/* Tickets list */}
      {view === "tickets" && (
        <div className="px-5 pb-5 space-y-3">
          {loadingTickets ? (
            <div className="flex items-center gap-2 py-4 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("common.loading")}…
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">
                {t("settings.features.support.noTickets")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {tickets.map((tk) => (
                <li key={tk.id}>
                  <button
                    onClick={() => openTicket(tk.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-m3-primary/40 hover:bg-m3-primary/5 transition-all text-left"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {tk.last_message
                          ? stripMarkdown(tk.last_message)
                          : t("settings.features.support.noMessagesYet")}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(
                          tk.last_message_at ?? tk.created_at,
                        ).toLocaleDateString()}
                        {tk.message_count != null &&
                          ` · ${tk.message_count} ${t("settings.features.support.messages")}`}
                      </p>
                    </div>
                    {(tk.unread_count ?? 0) > 0 && (
                      <span className="text-[10px] font-bold bg-m3-primary text-white rounded-full px-1.5 py-0.5">
                        {tk.unread_count}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_STYLES[tk.status] ?? "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}
                    >
                      {tk.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tickets.length < ticketCount && (
            <button
              onClick={loadTickets}
              className="w-full text-center text-[11px] font-semibold text-m3-primary py-2 hover:underline"
            >
              {t("settings.features.support.loadMore")}
            </button>
          )}
          {/* Quick starters */}
          <div className="pt-1 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {t("settings.features.support.startNew")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    icon: Sparkles,
                    label: t("settings.features.support.requestFeature"),
                    msg: t("settings.features.support.requestFeatureMsg"),
                  },
                  {
                    icon: Bug,
                    label: t("settings.features.support.reportBug"),
                    msg: t("settings.features.support.reportBugMsg"),
                  },
                ] as const
              ).map(({ icon: Icon, label, msg }) => (
                <button
                  key={label}
                  onClick={() => startNewChat(msg)}
                  className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 hover:border-m3-primary/50 hover:bg-m3-primary/5 transition-all text-left"
                >
                  <Icon className="w-4 h-4 text-m3-primary shrink-0" />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      {view === "chat" && (
        <div className="flex flex-col px-5 pb-5">
          <div className="h-80 overflow-y-auto space-y-3 py-2">
            {loadingMsgs ? (
              <div className="flex items-center justify-center gap-2 h-full text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("common.loading")}…
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-slate-400 text-center">
                  {t("settings.features.support.chatEmpty")}
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isCustomer = m.author_type === "customer";
                const isAI = m.author_type === "AI";
                return (
                  <div
                    key={m.id}
                    className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${isCustomer ? "bg-m3-primary text-white rounded-br-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm"}`}
                    >
                      {!isCustomer && (
                        <p className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                          {isAI && <Bot className="w-3 h-3" />}
                          {m.author_name ??
                            (isAI
                              ? t("settings.features.support.ai")
                              : t("settings.features.support.team"))}
                        </p>
                      )}
                      {isCustomer ? (
                        <p className="whitespace-pre-wrap wrap-break-word">
                          {m.content}
                        </p>
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: renderHtml(m.content),
                          }}
                        />
                      )}
                      <p
                        className={`text-[10px] mt-1 ${isCustomer ? "text-white/60" : "text-slate-400"}`}
                      >
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {!canReply ? (
            <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {t("settings.features.support.readOnlyTicket")}{" "}
                <button
                  onClick={() => startNewChat()}
                  className="text-m3-primary font-semibold hover:underline"
                >
                  {t("settings.features.support.startNewInstead")}
                </button>
              </span>
            </div>
          ) : (
            <div className="flex items-end gap-2 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMsg();
                  }
                }}
                rows={2}
                placeholder={t("settings.features.support.placeholder")}
                className="flex-1 resize-none text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-m3-primary/40"
              />
              <button
                onClick={sendMsg}
                disabled={!draft.trim() || sending}
                className="shrink-0 p-2.5 rounded-xl bg-m3-primary text-white disabled:opacity-40 hover:bg-m3-primary/90 transition-colors"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Restore */}
      {view === "restore" && (
        <div className="px-5 pb-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("settings.features.support.restoreDesc")}
          </p>
          {restoreSent ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs">
              <MailCheck className="w-4 h-4 shrink-0" />
              {t("settings.features.support.restoreSent")}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={restoreEmail}
                onChange={(e) => setRestoreEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendRestore();
                }}
                placeholder={t("settings.features.support.emailPlaceholder")}
                className="flex-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-m3-primary/40"
              />
              <button
                onClick={sendRestore}
                disabled={!restoreEmail.trim() || restoreSending}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-m3-primary text-white text-xs font-semibold disabled:opacity-40 hover:bg-m3-primary/90 transition-colors"
              >
                {restoreSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {t("settings.features.support.sendLink")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Tab ────────────────────────────────────────────────────── */
export const FeaturesTab: React.FC<FeaturesTabProps> = ({ active }) => {
  if (!active) return null;
  return (
    <div className="space-y-6">
      <EarlyAccessPanel />
      <SupportPanel />
    </div>
  );
};
