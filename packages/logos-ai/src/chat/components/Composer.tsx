/**
 * @license
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useLogosHost, useLogosI18n } from "../../host";
import { ArrowUp, Eye, EyeOff, FileText, Paperclip, Square, X } from "lucide-react";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { allChips } from "../../core/tools";
import { newId, type ChatAttachment, type PageContextSnapshot } from "../../types";

export type AiChatComposerHandle = { focus: () => void };

type Props = {
  streaming: boolean;
  pageContext: PageContextSnapshot;
  includeContext: boolean;
  onToggleContext: (v: boolean) => void;
  onSend: (text: string, attachments?: ChatAttachment[]) => void;
  onStop: () => void;
  /** Scope for draft persistence (conversation id). */
  draftKey: string;
};

const MAX_ROWS_PX = 168;
const MAX_ATTACHMENTS = 5;

function fileToAttachment(file: File): Promise<ChatAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: newId(),
        file,
        name: file.name || "attachment",
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        dataUrl: reader.result as string,
        isImage: file.type.startsWith("image/"),
      });
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Auto-growing composer with `/` quick actions; stays usable while streaming. */
export const AiChatComposer = forwardRef<AiChatComposerHandle, Props>(function AiChatComposer(
  { streaming, pageContext, includeContext, onToggleContext, onSend, onStop, draftKey },
  ref,
) {
  const { t } = useLogosI18n();
  const host = useLogosHost();
  const [draft, setDraft] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const storageKey = `hosanna:ai-draft:${draftKey}`;
  const attachmentsRef = useRef<ChatAttachment[]>([]);
  attachmentsRef.current = attachments;

  useImperativeHandle(ref, () => ({
    focus: () => areaRef.current?.focus(),
  }));

  // Restore the unsent draft for this conversation.
  useEffect(() => {
    try {
      setDraft(sessionStorage.getItem(storageKey) ?? "");
    } catch {
      setDraft("");
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      if (draft) sessionStorage.setItem(storageKey, draft);
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* storage unavailable */
    }
  }, [draft, storageKey]);

  // Auto-grow.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_ROWS_PX)}px`;
  }, [draft]);

  const slashQuery = /^\/[^\s]*$/.test(draft) ? draft.slice(1).toLowerCase() : null;

  const slashItems = useMemo(() => {
    if (slashQuery === null) return [];
    return allChips(pageContext).filter((c) => t(c.labelKey).toLowerCase().includes(slashQuery));
  }, [slashQuery, pageContext, t]);

  useEffect(() => setSlashIndex(0), [slashQuery]);

  const addFiles = useCallback(
    async (incoming: readonly File[]) => {
      const collected: ChatAttachment[] = [];
      for (const file of incoming) {
        if (attachmentsRef.current.length + collected.length >= MAX_ATTACHMENTS) break;
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (isPdf && host.renderPdf) {
          try {
            const rendered = await host.renderPdf(file);
            if (rendered.imagesBase64.length > 0) {
              rendered.imagesBase64.forEach((dataUrl, idx) => {
                if (attachmentsRef.current.length + collected.length >= MAX_ATTACHMENTS) return;
                collected.push({
                  id: newId(),
                  file,
                  name:
                    rendered.imagesBase64.length > 1 ? `${file.name} (p. ${idx + 1})` : file.name,
                  size: file.size,
                  mimeType: "image/jpeg",
                  dataUrl,
                  isImage: true,
                });
              });
              continue;
            }
          } catch {}
        }
        try {
          collected.push(await fileToAttachment(file));
        } catch {
          /* skip unreadable file */
        }
      }
      if (collected.length) setAttachments((prev) => [...prev, ...collected]);
    },
    [host.renderPdf],
  );

  const removeAttachment = (id: string) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      const hasAttachments = attachmentsRef.current.length > 0;
      if ((!value && !hasAttachments) || streaming) return;
      const sending = attachmentsRef.current;
      setDraft("");
      setAttachments([]);
      onSend(value, sending);
    },
    [streaming, onSend],
  );

  const pickSlash = (index: number) => {
    const chip = slashItems[index];
    if (!chip) return;
    setDraft("");
    onSend(t(chip.promptKey));
  };

  const slashOpen = slashQuery !== null;

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length === 0) return;
    e.preventDefault();
    void addFiles(files);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) void addFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div
      className={`logos-composer relative ${dragging ? "is-dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={onDrop}
    >
      {slashOpen && (
        <div
          role="listbox"
          aria-label={t("ai.chat.quickActions")}
          className="logos-popover absolute bottom-full left-0 right-0 mb-2 max-h-56 overflow-auto rounded-xl border border-m3-border bg-m3-card p-1.5 z-10"
        >
          {slashItems.length === 0 ? (
            <p className="m-0 px-2.5 py-2 text-[12px] text-m3-secondary">
              {t("ai.chat.slashEmpty")}
            </p>
          ) : (
            slashItems.map((chip, i) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.id}
                  type="button"
                  role="option"
                  aria-selected={i === slashIndex}
                  onMouseEnter={() => setSlashIndex(i)}
                  onClick={() => pickSlash(i)}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left ${
                    i === slashIndex ? "bg-m3-primary/10" : ""
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-m3-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] text-m3-text truncate">
                      {t(chip.labelKey)}
                    </span>
                    <span className="block text-[11px] text-m3-secondary truncate">
                      {t(chip.descKey)}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="group relative flex items-center gap-2 rounded-xl border border-m3-border bg-m3-card pl-1.5 pr-1 py-1 max-w-full"
            >
              {a.isImage ? (
                <img
                  src={a.dataUrl}
                  alt={a.name}
                  className="w-8 h-8 rounded object-cover border border-m3-border shrink-0"
                />
              ) : (
                <span className="w-8 h-8 rounded flex items-center justify-center bg-m3-sidebar text-m3-secondary shrink-0">
                  <FileText className="w-4 h-4" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-[11.5px] text-m3-text truncate max-w-36">{a.name}</span>
                <span className="block text-[10px] text-m3-secondary tabular-nums">
                  {formatBytes(a.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                aria-label={t("ai.chat.removeAttachment")}
                className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-m3-secondary hover:text-m3-text hover:bg-m3-hover"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.pro,.chordpro,.chopro,.md,.json"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) void addFiles(Array.from(files));
          if (e.target) e.target.value = "";
        }}
      />

      <div
        className={[
          "logos-composer-field flex items-end gap-1.5 rounded-[16px] border bg-m3-bg px-2 py-1.5 transition-[border-color,box-shadow,background] duration-200",
          dragging
            ? "border-m3-primary ring-2 ring-m3-primary/20"
            : "border-m3-border focus-within:border-m3-primary focus-within:ring-2 focus-within:ring-m3-primary/20",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label={t("ai.chat.attachFiles")}
          title={t("ai.chat.attachFiles")}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-m3-secondary hover:text-m3-text hover:bg-m3-hover transition-colors focus-visible:outline-2 focus-visible:outline-m3-primary"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <textarea
          ref={areaRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onPaste={onPaste}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (slashOpen && slashItems.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSlashIndex((i) => (i + 1) % slashItems.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSlashIndex((i) => (i - 1 + slashItems.length) % slashItems.length);
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                pickSlash(slashIndex);
                return;
              }
            }
            if (e.key === "Escape") {
              if (slashOpen) {
                e.preventDefault();
                setDraft("");
              } else if (streaming) {
                e.preventDefault();
                onStop();
              }
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(draft);
            }
          }}
          placeholder={t("ai.chat.placeholder")}
          aria-label={t("ai.chat.placeholder")}
          // The wrapper draws the focus ring; the global textarea:focus-visible
          // outline would otherwise add a second, mis-sized box.
          style={{ outline: "none", boxShadow: "none" }}
          className="flex-1 min-w-0 block min-h-8 m-0 py-1.5 px-0 border-0 resize-none bg-transparent text-m3-text text-[13px] leading-5 placeholder:text-m3-secondary/70"
        />
        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 w-8 h-8 rounded-lg bg-m3-text text-m3-bg flex items-center justify-center hover:opacity-85 transition-opacity active:scale-95"
            aria-label={t("ai.chat.stop")}
            title={`${t("ai.chat.stop")} (Esc)`}
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => submit(draft)}
            disabled={!draft.trim() && attachments.length === 0}
            className="logos-send-button shrink-0 w-8 h-8 rounded-lg bg-m3-primary text-white flex items-center justify-center disabled:opacity-35 hover:opacity-90 transition-[transform,opacity,background] duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-m3-primary focus-visible:outline-offset-2"
            aria-label={t("ai.chat.send")}
            title={t("ai.chat.send")}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5 text-[10.5px] text-m3-secondary">
        <button
          type="button"
          onClick={() => onToggleContext(!includeContext)}
          aria-pressed={includeContext}
          title={t("ai.chat.contextHint")}
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-colors hover:bg-m3-hover ${
            includeContext ? "text-m3-primary" : ""
          }`}
        >
          {includeContext ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          {t("ai.chat.includeContext")}
        </button>
        <span className="truncate hidden sm:inline">{t("ai.chat.composerHint")}</span>
      </div>
    </div>
  );
});
