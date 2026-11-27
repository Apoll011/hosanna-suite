"use client";

import { useActiveOrganization } from "@/hooks/useActiveOrganization";
import { ensureActiveOrganizationSession } from "@/lib/services/api";
import { notificationsApi, type NotificationChannel } from "@/lib/services/notifications-api";
import { useI18n } from "@/lib/ui/i18n";
import type { WidgetRendererProps } from "@hosanna/dashboard/react";
import { NotificationChatBox } from "@hosanna/ui";
import { ArrowUp, Bell, Building2, CheckCircle2, Users } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { ChannelSpringDropdown, type ChannelOption } from "./ChannelSpringDropdown";
import {
  buildMentionCandidates,
  buildNotificationPayloads,
  chipDisplayText,
  filterMentionCandidates,
  serializeComposerMessage,
  type ComposerPart,
  type MentionTarget,
} from "./sendNotificationModel";
import { getWidgetDensity, useOrganizationLoader, useWidgetPreview } from "./shared";
import {
  clamp,
  createSpring,
  prefersReducedMotion,
  stepSpring,
  tuneSpring,
  type SpringState,
} from "./springMotion";

type TeamRow = {
  id: string;
  name: string;
  memberCount: number;
};

const MENTION_ROW_H = 42;
const MENTION_PAD = 4;

export function SendNotificationWidget({ instance }: WidgetRendererProps) {
  const { t } = useI18n();
  const preview = useWidgetPreview();
  const { organization } = useActiveOrganization();
  const density = getWidgetDensity(instance);

  const loadTeams = useCallback(async (orgId: string) => {
    await ensureActiveOrganizationSession(orgId);
    const res = await fetch("/api/organization/teams", { credentials: "include" });
    if (!res.ok) throw new Error("Request failed");
    return (await res.json()) as { teams: TeamRow[] };
  }, []);

  const liveTeams = useOrganizationLoader("org-teams", loadTeams, !preview);
  const teams = useMemo(
    () => (preview ? preview.teams : (liveTeams.value?.teams ?? [])),
    [preview, liveTeams.value?.teams],
  );
  const members = useMemo(
    () => (preview ? preview.organization.members : (organization?.members ?? [])),
    [preview, preview?.organization.members, organization?.members],
  );

  const candidates = useMemo(
    () =>
      buildMentionCandidates({
        allLabel: t("home.widgets.sendNotification.allTarget"),
        teams,
        members,
      }),
    [t, teams, members],
  );

  const [parts, setParts] = useState<ComposerPart[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [channels, setChannels] = useState<NotificationChannel[]>(["inbox"]);
  const [notificationType, setNotificationType] = useState("info");
  const [isSending, setIsSending] = useState(false);
  const [focused, setFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error" | "hint";
    text: string;
  } | null>(null);

  const edRef = useRef<HTMLDivElement>(null);
  const queryRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hlRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);

  const chipSprings = useRef(new Map<string, SpringState>());
  const chipEls = useRef(new Map<string, HTMLSpanElement>());
  const rowSprings = useRef(new Map<string, { Y: SpringState; O: SpringState }>());
  const rowEls = useRef(new Map<string, HTMLButtonElement>());
  const menuSprings = useRef({
    MH: createSpring(0, 260, 24),
    MO: createSpring(0, 420, 32),
    HA: createSpring(MENTION_PAD, 620, 36),
    HB: createSpring(MENTION_PAD, 190, 19),
    MX: createSpring(0, 900, 50),
    MY: createSpring(0, 900, 50),
  });

  const openUpRef = useRef(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = useMemo(
    () => (query === null ? [] : filterMentionCandidates(candidates, query)),
    [candidates, query],
  );
  const menuOpen = query !== null && filtered.length > 0;

  useEffect(() => {
    if (activeIdx >= filtered.length) {
      setActiveIdx(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIdx]);

  const placeMenu = useCallback(
    (fresh: boolean, count: number) => {
      const qEl = queryRef.current;
      const menu = menuRef.current;
      if (!qEl || !menu) return;
      const rect = qEl.getBoundingClientRect();
      const menuW = 236;
      const h = count * MENTION_ROW_H + MENTION_PAD * 2;
      const below = rect.bottom + 6;
      const ms = menuSprings.current;
      ms.MX.t = clamp(rect.left - 8, 8, window.innerWidth - menuW - 8);
      if (fresh) {
        const maxH = Math.min(candidates.length, 6) * MENTION_ROW_H + MENTION_PAD * 2;
        openUpRef.current = below + maxH > window.innerHeight - 12 && rect.top > maxH + 12;
      }
      ms.MY.t = openUpRef.current ? Math.max(8, rect.top - 6 - h) : below;
      if (fresh || ms.MO.x < 0.05) {
        ms.MX.x = ms.MX.t;
        ms.MY.x = ms.MY.t;
      }
    },
    [candidates.length],
  );

  useEffect(() => {
    const ms = menuSprings.current;
    const reduced = prefersReducedMotion();
    tuneSpring(ms.MH, 260, 24, reduced);
    tuneSpring(ms.MO, 420, 32, reduced);
    tuneSpring(ms.HA, 620, 36, reduced);
    tuneSpring(ms.HB, 190, 19, reduced);

    const visibleCount = Math.min(filtered.length, 6);
    const fresh = menuOpen && !wasOpenRef.current;
    wasOpenRef.current = menuOpen;

    if (fresh) {
      ms.MO.x = 0;
      ms.HA.x = ms.HB.x = MENTION_PAD + activeIdx * MENTION_ROW_H;
    }

    ms.MO.t = menuOpen ? 1 : 0;
    ms.MH.t = menuOpen ? visibleCount * MENTION_ROW_H + MENTION_PAD * 2 : 0;

    candidates.forEach((cand, i) => {
      const key = `${cand.kind}:${cand.id}`;
      let rs = rowSprings.current.get(key);
      if (!rs) {
        rs = {
          Y: createSpring(MENTION_PAD + i * MENTION_ROW_H, 260, 24),
          O: createSpring(0, 420, 32),
        };
        rowSprings.current.set(key, rs);
      }
      tuneSpring(rs.Y, 260, 24, reduced);
      tuneSpring(rs.O, 420, 32, reduced);
      const matchIdx = filtered.findIndex((f) => f.kind === cand.kind && f.id === cand.id);
      const isOn = matchIdx > -1 && matchIdx < 6;
      rs.O.t = isOn ? 1 : 0;
      if (isOn) {
        const targetY = MENTION_PAD + matchIdx * MENTION_ROW_H;
        if (fresh) {
          rs.Y.x = targetY - 8;
          rs.O.x = 0;
        }
        rs.Y.t = targetY;
      }
    });

    if (menuOpen) {
      const y = MENTION_PAD + activeIdx * MENTION_ROW_H;
      ms.HA.t = y;
      ms.HB.t = y;
      requestAnimationFrame(() => placeMenu(fresh, visibleCount));
    }
  }, [menuOpen, filtered, candidates, activeIdx, placeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const onResize = () => placeMenu(false, Math.min(filtered.length, 6));
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [menuOpen, filtered.length, placeMenu]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      const ms = menuSprings.current;
      const sub = 4;
      const stepDt = dt / sub;
      for (let k = 0; k < sub; k++) {
        stepSpring(ms.MH, stepDt);
        stepSpring(ms.MO, stepDt);
        stepSpring(ms.HA, stepDt);
        stepSpring(ms.HB, stepDt);
        stepSpring(ms.MX, stepDt);
        stepSpring(ms.MY, stepDt);
        rowSprings.current.forEach((rs) => {
          stepSpring(rs.Y, stepDt);
          stepSpring(rs.O, stepDt);
        });
        chipSprings.current.forEach((cs) => stepSpring(cs, stepDt));
      }

      const menu = menuRef.current;
      if (menu) {
        const o = clamp(ms.MO.x, 0, 1);
        const h = Math.max(0, ms.MH.x);
        menu.style.height = `${h.toFixed(1)}px`;
        menu.style.opacity = o.toFixed(3);
        menu.style.visibility = h < 1 && o < 0.02 ? "hidden" : "visible";
        menu.style.transform = `translate(${ms.MX.x.toFixed(1)}px, ${(ms.MY.x + (1 - o) * -6).toFixed(1)}px)`;
      }

      if (hlRef.current) {
        const top = Math.min(ms.HA.x, ms.HB.x);
        hlRef.current.style.transform = `translateY(${top.toFixed(1)}px)`;
        hlRef.current.style.height = `${(Math.abs(ms.HA.x - ms.HB.x) + MENTION_ROW_H).toFixed(1)}px`;
      }

      rowSprings.current.forEach((rs, key) => {
        const el = rowEls.current.get(key);
        if (!el) return;
        const v = clamp(rs.O.x, 0, 1);
        el.style.opacity = v.toFixed(3);
        el.style.transform = `translateY(${rs.Y.x.toFixed(1)}px) scale(${(0.92 + 0.08 * v).toFixed(3)})`;
        el.style.visibility = v < 0.01 ? "hidden" : "visible";
      });

      chipSprings.current.forEach((cs, id) => {
        const el = chipEls.current.get(id);
        if (el) el.style.transform = `scale(${cs.x.toFixed(3)})`;
      });

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const appendText = useCallback((prev: ComposerPart[], text: string): ComposerPart[] => {
    if (!text) return prev;
    const last = prev[prev.length - 1];
    if (last && last.t === "text") {
      return [...prev.slice(0, -1), { t: "text", s: last.s + text }];
    }
    return [...prev, { t: "text", s: text }];
  }, []);

  const insertChar = useCallback(
    (ch: string) => {
      setFeedback(null);
      if (query !== null) {
        if (ch === " " && filtered.length === 0) {
          setParts((prev) => appendText(prev, `@${query} `));
          setQuery(null);
        } else if (ch === "\n") {
          setParts((prev) => appendText(prev, `@${query}\n`));
          setQuery(null);
        } else {
          setQuery((prev) => (prev ?? "") + ch);
        }
        return;
      }

      if (ch === "@") {
        setQuery("");
        setActiveIdx(0);
        return;
      }

      setParts((prev) => appendText(prev, ch));
    },
    [query, filtered.length, appendText],
  );

  const handleBackspace = useCallback(() => {
    setFeedback(null);
    if (query !== null) {
      if (query.length > 0) {
        setQuery(query.slice(0, -1));
      } else {
        setQuery(null);
      }
      return;
    }

    setParts((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      if (last.t === "text") {
        const nextText = last.s.slice(0, -1);
        return nextText ? [...prev.slice(0, -1), { t: "text", s: nextText }] : prev.slice(0, -1);
      }
      chipSprings.current.delete(last.id);
      chipEls.current.delete(last.id);
      return prev.slice(0, -1);
    });
  }, [query]);

  const pickTarget = useCallback((target: MentionTarget) => {
    const chipId = `${target.kind}:${target.id}:${Date.now()}:${Math.random().toString(36).slice(2, 6)}`;
    const reduced = prefersReducedMotion();
    const s = createSpring(reduced ? 1 : 0.6, 520, 16);
    tuneSpring(s, 520, 16, reduced);
    s.t = 1;
    chipSprings.current.set(chipId, s);

    setParts((prev) => [...prev, { t: "chip", id: chipId, target }, { t: "text", s: " " }]);
    setQuery(null);
    setActiveIdx(0);
    setFeedback(null);
    edRef.current?.focus();
  }, []);

  const playSendAnimation = () => {
    arrowRef.current?.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: "translateY(-22px)", opacity: 0 },
        { transform: "translateY(18px)", opacity: 0, offset: 0.5 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 520, easing: "cubic-bezier(.3,.7,.2,1)" },
    );
    sendBtnRef.current?.animate([{ scale: "1" }, { scale: "0.93" }, { scale: "1" }], {
      duration: 240,
    });
  };

  const { text: serializedText, targets: mentionTargets } = useMemo(
    () => serializeComposerMessage(parts),
    [parts],
  );
  const hasContent = serializedText.length > 0 || query !== null;
  const canSend = serializedText.length > 0 && mentionTargets.length > 0 && channels.length > 0;

  const handleSend = async () => {
    if (isSending) return;
    if (!hasContent) return;

    if (mentionTargets.length === 0) {
      setFeedback({ kind: "hint", text: t("home.widgets.sendNotification.needMention") });
      return;
    }

    if (preview) {
      playSendAnimation();
      setParts([]);
      setQuery(null);
      setFeedback({ kind: "success", text: t("home.widgets.sendNotification.sentPreview") });
      window.setTimeout(() => setFeedback(null), 2600);
      return;
    }

    const orgId = organization?.id;
    if (!orgId) return;

    const payloads = buildNotificationPayloads({
      organizationId: orgId,
      text: serializedText,
      targets: mentionTargets,
      channels,
      type: notificationType,
    });
    if (payloads.length === 0) return;

    setIsSending(true);
    setFeedback(null);
    playSendAnimation();

    try {
      const results = await Promise.all(
        payloads.map((payload) => notificationsApi.create(payload, { organizationId: orgId })),
      );
      const totalRecipients = results.reduce((sum, r) => sum + (r.recipientCount ?? 0), 0);
      setParts([]);
      setQuery(null);
      setFeedback({
        kind: "success",
        text: t("home.widgets.sendNotification.sentCount", { count: totalRecipients }),
      });
      window.setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({
        kind: "error",
        text:
          err instanceof Error && err.message
            ? err.message
            : t("home.widgets.sendNotification.sendError"),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (menuOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const delta = e.key === "ArrowDown" ? 1 : -1;
        setActiveIdx((prev) => (prev + delta + filtered.length) % filtered.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const target = filtered[activeIdx];
        if (target) pickTarget(target);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setParts((prev) => appendText(prev, `@${query ?? ""}`));
        setQuery(null);
        return;
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSend();
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      handleBackspace();
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
      return;
    }

    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      insertChar("\n");
      return;
    }

    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      insertChar(e.key);
    }
  };

  const handleBeforeInput = (e: FormEvent<HTMLDivElement>) => {
    const native = e.nativeEvent as InputEvent;
    if (native.inputType === "insertText" && native.data) {
      e.preventDefault();
      for (const ch of native.data) {
        insertChar(ch);
      }
    } else if (native.inputType === "deleteContentBackward") {
      e.preventDefault();
      handleBackspace();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain");
    if (!pasted) return;
    for (const ch of pasted) {
      insertChar(ch);
    }
  };

  const channelOptions = useMemo<ChannelOption[]>(
    () => [
      {
        id: "inbox",
        label: t("home.widgets.sendNotification.channels.inbox"),
        dotColor: "#0f766e",
      },
      {
        id: "email",
        label: t("home.widgets.sendNotification.channels.email"),
        dotColor: "#0284c7",
      },
      { id: "push", label: t("home.widgets.sendNotification.channels.push"), dotColor: "#d97706" },
    ],
    [t],
  );

  if (density === "compact") {
    return (
      <NotificationChatBox title={t("home.widgets.sendNotification.title")} compact>
        <Bell className="ml-auto h-4 w-4 shrink-0 text-m3-primary" aria-hidden />
      </NotificationChatBox>
    );
  }

  return (
    <NotificationChatBox title={t("home.widgets.sendNotification.title")}>
      <div className="flex min-h-0 flex-1 flex-col justify-between rounded-xl border border-m3-border bg-m3-sidebar/35 p-3">
        <div
          ref={edRef}
          tabIndex={0}
          role="textbox"
          aria-multiline="true"
          aria-label={t("home.widgets.sendNotification.placeholder")}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          onBeforeInput={handleBeforeInput}
          onPaste={handlePaste}
          onClick={() => edRef.current?.focus()}
          className="relative min-h-[56px] flex-1 cursor-text overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 text-m3-text outline-none"
        >
          {parts.length === 0 && query === null && !focused ? (
            <span className="pointer-events-none absolute left-0 top-0 text-m3-input">
              {t("home.widgets.sendNotification.placeholder")}
            </span>
          ) : null}

          {parts.map((part, i) =>
            part.t === "text" ? (
              <span key={`t-${i}`}>{part.s}</span>
            ) : (
              <span
                key={part.id}
                ref={(el) => {
                  if (el) chipEls.current.set(part.id, el);
                  else chipEls.current.delete(part.id);
                }}
                className="inline-flex items-center rounded-md bg-m3-primary-light px-1.5 py-0.5 text-[13px] font-medium leading-5 text-m3-primary align-baseline origin-center"
              >
                {chipDisplayText(part.target)}
              </span>
            ),
          )}

          {query !== null ? (
            <span
              ref={queryRef}
              className="rounded-md bg-m3-hover px-1 py-0.5 font-medium text-m3-text"
            >
              @{query}
            </span>
          ) : null}

          {focused ? (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-4 w-[2px] translate-y-[2px] animate-pulse rounded-full bg-m3-primary"
            />
          ) : null}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-m3-border/60">
          <ChannelSpringDropdown
            selected={channels}
            onChange={setChannels}
            options={channelOptions}
            ariaLabel={t("home.widgets.sendNotification.channelsLabel")}
            allLabel={t("home.widgets.sendNotification.channels.all")}
          />

          <select
            value={notificationType}
            onChange={(event) => setNotificationType(event.target.value)}
            aria-label={t("home.widgets.sendNotification.typeLabel")}
            className="h-8 max-w-36 rounded-lg border border-m3-border bg-m3-card px-2.5 text-xs font-medium text-m3-text shadow-xs transition-colors hover:bg-m3-hover focus-visible:outline-2 focus-visible:outline-m3-primary"
          >
            {(["info", "organization", "team", "security", "billing"] as const).map((type) => (
              <option key={type} value={type}>
                {t(
                  `home.widgets.sendNotification.types.${type}` as "home.widgets.sendNotification.types.info",
                )}
              </option>
            ))}
          </select>

          <span className="min-w-0 flex-1 truncate text-xs text-m3-secondary">
            {feedback ? (
              <span
                className={
                  feedback.kind === "error"
                    ? "text-m3-danger font-medium"
                    : feedback.kind === "success"
                      ? "inline-flex items-center gap-1 text-m3-success font-medium"
                      : "text-m3-warning font-medium"
                }
              >
                {feedback.kind === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : null}
                {feedback.text}
              </span>
            ) : (
              t("home.widgets.sendNotification.hint")
            )}
          </span>

          <button
            ref={sendBtnRef}
            type="button"
            disabled={!hasContent || isSending}
            onClick={() => void handleSend()}
            aria-label={t("home.widgets.sendNotification.send")}
            className={`relative ml-auto flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed ${
              canSend
                ? "bg-m3-primary text-white hover:bg-m3-primary-dark"
                : hasContent
                  ? "bg-m3-hover text-m3-text"
                  : "bg-m3-hover/60 text-m3-input"
            }`}
          >
            <span ref={arrowRef} className="grid place-items-center">
              <ArrowUp className="h-4 w-4" aria-hidden />
            </span>
          </button>
        </div>
      </div>

      {mounted
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              aria-label={t("home.widgets.sendNotification.mentionList")}
              className={`fixed left-0 top-0 z-50 w-[236px] overflow-hidden rounded-xl border border-m3-border bg-m3-card shadow-lg ${
                menuOpen ? "pointer-events-auto" : "pointer-events-none"
              }`}
              style={{ height: 0, opacity: 0, visibility: "hidden" }}
            >
              <span
                ref={hlRef}
                aria-hidden
                className="pointer-events-none absolute left-1 right-1 top-0 rounded-lg bg-m3-hover"
                style={{ opacity: menuOpen ? 1 : 0 }}
              />
              {candidates.map((cand) => {
                const key = `${cand.kind}:${cand.id}`;
                const matchIdx = filtered.findIndex(
                  (f) => f.kind === cand.kind && f.id === cand.id,
                );
                const isSelected = matchIdx === activeIdx && menuOpen;
                return (
                  <button
                    key={key}
                    ref={(el) => {
                      if (el) rowEls.current.set(key, el);
                      else rowEls.current.delete(key);
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    onPointerDown={(e) => e.preventDefault()}
                    onPointerEnter={() => {
                      if (matchIdx > -1) setActiveIdx(matchIdx);
                    }}
                    onClick={() => pickTarget(cand)}
                    className="absolute left-1 right-1 top-0 z-10 flex items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-medium text-m3-text cursor-pointer select-none"
                    style={{ height: `${MENTION_ROW_H}px`, opacity: 0 }}
                  >
                    {cand.kind === "all" ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-m3-primary-light text-m3-primary">
                        <Building2 className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    ) : cand.kind === "team" ? (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-m3-border bg-m3-sidebar text-m3-text">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    ) : cand.image ? (
                      <img
                        src={cand.image}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded-full border border-m3-border object-cover"
                      />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-m3-border bg-m3-sidebar text-[10px] font-semibold text-m3-text">
                        {cand.label[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}

                    <span className="min-w-0 flex-1 truncate">
                      {cand.kind === "all" ? `@${cand.label}` : cand.label}
                    </span>

                    <span className="shrink-0 text-[11px] font-normal text-m3-secondary">
                      {cand.kind === "all"
                        ? t("home.widgets.sendNotification.allBadge")
                        : cand.kind === "team"
                          ? t("home.widgets.sendNotification.teamBadge")
                          : ""}
                    </span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </NotificationChatBox>
  );
}
