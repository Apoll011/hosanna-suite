import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link2, Search, X } from "lucide-react";
import type { Service } from "../../interfaces";

export function serviceTotalMinutes(service: Service): number {
  const seconds = (service.elements ?? []).reduce(
    (acc, el) => acc + Math.max(0, Number(el.duration || 0)),
    0,
  );
  return Math.max(1, Math.round(seconds / 60));
}

function formatShortDate(iso: string): string {
  const [y, m, d] = (iso || "").split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return iso || "";
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

interface ServiceLinkFieldProps {
  services: Service[];
  isLoading?: boolean;
  value: string | null;
  onChange: (serviceId: string | null) => void;
}

export const ServiceLinkField: React.FC<ServiceLinkFieldProps> = ({
  services,
  isLoading = false,
  value,
  onChange,
}) => {
  const [draft, setDraft] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const linked = services.find((s) => s.id === value) ?? null;

  const sorted = useMemo(
    () => [...services].sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [services],
  );

  const q = draft.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? sorted.filter((s) => s.name.toLowerCase().includes(q)) : sorted),
    [sorted, q],
  );

  const pick = (id: string) => {
    onChange(id);
    setDraft("");
    setOpen(false);
    setHighlight(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) pick(filtered[highlight % filtered.length].id);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => (filtered.length ? (h + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (filtered.length ? (h - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else {
      setOpen(true);
      setHighlight(0);
    }
  };

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
    <div ref={rootRef} className="space-y-2">
      {linked ? (
        <div className="flex items-center justify-between gap-3 p-3 bg-m3-sidebar border border-m3-primary/30 rounded-xl">
          <div className="min-w-0 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-m3-primary/10 text-m3-primary flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-m3-text truncate">{linked.name}</p>
              <p className="text-[11px] font-semibold text-m3-secondary">
                {formatShortDate(linked.date)} · {serviceTotalMinutes(linked)} min
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1 rounded-lg text-m3-secondary hover:text-m3-danger hover:bg-m3-danger/10 transition-colors cursor-pointer"
            title="Unlink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-m3-secondary pointer-events-none" />
          <input
            type="text"
            value={draft}
            disabled={isLoading}
            onChange={(e) => {
              setDraft(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Loading..." : "Search service to link..."}
            className="w-full h-11 pl-10 pr-3 bg-m3-sidebar border border-m3-border rounded-md text-sm font-semibold focus:outline-none focus:border-m3-primary transition-colors disabled:opacity-50"
          />

          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-m3-card border border-m3-border rounded-xl shadow-xl z-30 p-1 space-y-0.5">
              {filtered.length === 0 ? (
                <p className="text-xs text-m3-secondary py-3 text-center">No services found</p>
              ) : (
                filtered.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pick(s.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      idx === highlight ? "bg-m3-hover" : "hover:bg-m3-hover"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-m3-text truncate">{s.name}</p>
                      <p className="text-[10px] text-m3-secondary">{formatShortDate(s.date)}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-m3-secondary shrink-0">
                      {serviceTotalMinutes(s)} min
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
