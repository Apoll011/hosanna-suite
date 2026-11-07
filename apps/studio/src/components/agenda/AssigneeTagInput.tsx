/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from "@/src/contexts/AuthContext";
import { useI18n } from "@/src/lib/i18n";
import { Assignee } from "@/src/types";
import { getAvatarGradient, getInitials } from "@/src/utils";
import { X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface AssigneeTagInputProps {
  assignees: Assignee[];
  onChange: (assignees: Assignee[]) => void;
  /**
   * Manually-typed assignees (no `memberId`) already used in other events —
   * suggested so users don't have to retype names for every event. Their ids
   * are unstable; when picked, a fresh manual assignee is created for the name.
   */
  manualSuggestions?: Assignee[];
}

const manualId = () =>
  `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

function Avatar({
  assignee,
  className,
}: {
  assignee: Assignee;
  className: string;
}) {
  return (
    <span
      className={`${className} rounded-full flex items-center justify-center font-extrabold text-white shrink-0 bg-linear-to-tr ${getAvatarGradient(
        assignee.name,
      )} overflow-hidden`}
    >
      {assignee.avatarUrl ? (
        <img
          src={assignee.avatarUrl}
          alt={assignee.name}
          className="w-full h-full object-cover"
        />
      ) : (
        getInitials(assignee.name)
      )}
    </span>
  );
}

/**
 * "Type a name" tag input with suggestions:
 * - organization members (linked via `memberId`) are suggested as you type;
 * - manually-typed names still create a plain assignee (no `memberId`);
 * - previously used manual assignees (from any event) are suggested too.
 */
export const AssigneeTagInput: React.FC<AssigneeTagInputProps> = ({
  assignees,
  onChange,
  manualSuggestions = [],
}) => {
  const { organization } = useAuth();
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Org members first, then manual assignees whose name doesn't collide with a
  // member (a member link always wins over a free-typed name).
  const suggestions = useMemo<Assignee[]>(() => {
    const members = organization?.members ?? [];
    const memberNames = new Set(
      members.map((m) => m.user.name.trim().toLowerCase()),
    );
    const memberSuggestions: Assignee[] = members.map((m) => ({
      id: m.id,
      memberId: m.id,
      name: m.user.name,
      // `user.image` can be null for members without an avatar — omit the
      // field instead of storing null (the UI falls back to initials).
      avatarUrl: m.user.image ?? undefined,
    }));
    const manual = manualSuggestions.filter(
      (a) => !memberNames.has(a.name.trim().toLowerCase()),
    );
    return [...memberSuggestions, ...manual];
  }, [organization?.members, manualSuggestions]);

  const q = draft.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? suggestions.filter((s) => s.name.toLowerCase().includes(q))
        : suggestions,
    [suggestions, q],
  );

  const isDuplicate = (a: Assignee) =>
    assignees.some((x) =>
      a.memberId && x.memberId
        ? x.memberId === a.memberId
        : x.name.trim().toLowerCase() === a.name.trim().toLowerCase(),
    );

  const addAssignee = (a: Assignee) => {
    if (!isDuplicate(a)) {
      onChange([...assignees, a.memberId ? a : { ...a, id: manualId() }]);
    }
    setDraft("");
    setOpen(false);
    setHighlight(0);
  };

  const addFromDraft = () => {
    const name = draft.trim();
    if (!name) return;
    addAssignee({ id: manualId(), name });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (draft.trim() && filtered.length > 0) {
        addAssignee(filtered[highlight % filtered.length]);
      } else {
        addFromDraft();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (filtered.length ? (h + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) =>
        filtered.length ? (h - 1 + filtered.length) % filtered.length : 0,
      );
    } else if (e.key === "Escape") {
      setOpen(false);
    } else {
      setOpen(true);
      setHighlight(0);
    }
  };

  // Close the dropdown when clicking anywhere outside the input.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div ref={rootRef}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {assignees.map((a) => (
          <span
            key={a.id}
            className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-[var(--radius-pill)] bg-m3-sidebar text-xs font-semibold text-m3-text"
          >
            <Avatar assignee={a} className="w-5 h-5 text-[9px]" />
            {a.name}
            {a.memberId && (
              <span className="text-label text-m3-primary bg-m3-primary/10 border border-m3-primary/20 px-1.5 py-0.5 rounded-[var(--radius-pill)]">
                {t("agenda.memberBadge")}
              </span>
            )}
            <button
              onClick={() => onChange(assignees.filter((x) => x.id !== a.id))}
              className="inline-flex items-center justify-center min-h-6 min-w-6 text-m3-secondary hover:text-m3-danger cursor-pointer"
              title={t("agenda.remove")}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("agenda.assigneePlaceholder")}
            className="flex-1 min-h-10 px-3 bg-m3-card border border-m3-border rounded-[var(--radius-md)] text-xs font-semibold text-m3-text placeholder:text-m3-input focus:outline-none focus:ring-2 focus:ring-m3-primary/25 focus:border-m3-primary transition-colors"
          />
          <button
            type="button"
            onClick={addFromDraft}
            className="px-3 min-h-10 rounded-[var(--radius-md)] border border-m3-border text-xs font-semibold text-m3-text hover:bg-m3-hover transition-colors cursor-pointer"
          >
            {t("agenda.add")}
          </button>
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-m3-card border border-m3-border rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-1.5">
            {filtered.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addAssignee(s);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 min-h-10 rounded-[var(--radius-md)] text-left transition-colors cursor-pointer ${
                  i === highlight ? "bg-m3-hover" : "hover:bg-m3-hover/60"
                }`}
              >
                <Avatar assignee={s} className="w-6 h-6 text-[10px]" />
                <span className="flex-1 min-w-0 text-xs font-semibold text-m3-text truncate">
                  {s.name}
                </span>
                <span className="text-label shrink-0">
                  {s.memberId
                    ? t("agenda.memberBadge")
                    : t("agenda.otherEvents")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
