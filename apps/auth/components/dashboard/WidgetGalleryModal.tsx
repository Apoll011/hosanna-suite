"use client";

import { authDashboardRenderers } from "@/components/dashboard/registry";
import { WidgetPreviewProvider } from "@/components/dashboard/previewMock";
import { useI18n } from "@/lib/ui/i18n";
import type { DashboardLayout, WidgetDefinition, WidgetInstance } from "@hosanna/dashboard/core";
import { Badge, Button, type SuiteCatalogApp } from "@hosanna/ui";
import { Check, Plus, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

type WidgetGalleryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  widgets: readonly WidgetDefinition[];
  draft: DashboardLayout | null;
  apps: readonly SuiteCatalogApp[];
  onAddWidget: (widgetId: string) => void;
};

export function WidgetGalleryModal({
  isOpen,
  onClose,
  widgets,
  draft,
  apps,
  onAddWidget,
}: WidgetGalleryModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);
  const [rendered, setRendered] = useState(isOpen);
  const [shown, setShown] = useState(false);
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    const timer = window.setTimeout(() => setRendered(false), 200);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      if (!wasOpenRef.current) {
        setQuery("");
        setActiveSection("all");
        requestAnimationFrame(() => panelRef.current?.focus());
      }
      wasOpenRef.current = true;
    } else {
      wasOpenRef.current = false;
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const sectionKeyFor = (widget: WidgetDefinition) =>
    widget.group ?? "suite.apps." + widget.app + ".name";

  const allSections = useMemo(() => [...new Set(widgets.map(sectionKeyFor))], [widgets]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredWidgets = useMemo(() => {
    return widgets.filter((widget) => {
      if (activeSection !== "all" && sectionKeyFor(widget) !== activeSection) {
        return false;
      }
      if (!normalizedQuery) return true;
      const title = t(widget.title as Parameters<typeof t>[0]).toLowerCase();
      const description = t(widget.description as Parameters<typeof t>[0]).toLowerCase();
      const sectionName = t(sectionKeyFor(widget) as Parameters<typeof t>[0]).toLowerCase();
      const appName = t(
        ("suite.apps." + widget.app + ".name") as Parameters<typeof t>[0],
      ).toLowerCase();
      const patterns = (widget.searchPatterns ?? []).map((key) =>
        t(key as Parameters<typeof t>[0]).toLowerCase(),
      );
      return (
        title.includes(normalizedQuery) ||
        description.includes(normalizedQuery) ||
        sectionName.includes(normalizedQuery) ||
        appName.includes(normalizedQuery) ||
        patterns.some((pattern) => pattern.includes(normalizedQuery))
      );
    });
  }, [widgets, activeSection, normalizedQuery, t]);

  useEffect(() => {
    if (filteredWidgets.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredWidgets.some((w) => w.id === selectedId)) {
      setSelectedId(filteredWidgets[0].id);
    }
  }, [filteredWidgets, selectedId]);

  const selectedWidget = useMemo(
    () => filteredWidgets.find((w) => w.id === selectedId) ?? filteredWidgets[0] ?? null,
    [filteredWidgets, selectedId],
  );

  const previewInstance = useMemo<WidgetInstance | null>(() => {
    if (!selectedWidget) return null;
    return {
      instanceId: "preview:" + selectedWidget.id,
      widget: selectedWidget.id,
      x: 0,
      y: 0,
      w: selectedWidget.defaultSize.w,
      h: selectedWidget.defaultSize.h,
      config: selectedWidget.config?.defaults ? { ...selectedWidget.config.defaults } : undefined,
      configVersion: selectedWidget.config?.version,
    };
  }, [selectedWidget]);

  if (!rendered) return null;

  const isAdded = (widget: WidgetDefinition) => {
    const count = draft?.items.filter((item) => item.widget === widget.id).length ?? 0;
    return Boolean(widget.singleton && count > 0);
  };

  const PreviewRenderer = selectedWidget ? authDashboardRenderers[selectedWidget.id] : null;
  const previewWidth = selectedWidget
    ? Math.min(Math.max(selectedWidget.defaultSize.w * 84, 240), 620)
    : 340;
  const previewMinHeight = selectedWidget
    ? Math.min(Math.max(selectedWidget.defaultSize.h * 80, 88), 340)
    : 180;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-m3-bg/75 p-3 backdrop-blur-sm overscroll-contain transition-opacity duration-200 ease-in-out sm:p-5 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex max-h-[min(90vh,760px)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-m3-border bg-m3-card shadow-lg outline-none transition-all duration-200 ease-in-out ${
          shown ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
        }`}
      >
        <div className="space-y-3 border-b border-m3-border/70 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 id={titleId} className="text-title text-m3-text">
                {t("home.dashboard.gallery")}
              </h2>
              <Badge variant="neutral" size="sm" className="tabular-nums">
                {filteredWidgets.length}
              </Badge>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("home.dashboard.cancel")}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-m3-secondary transition-colors hover:bg-m3-hover hover:text-m3-text cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <label className="relative block flex-1 sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-m3-secondary"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("home.dashboard.searchWidgets")}
                className="h-9 w-full rounded-md border border-m3-border bg-m3-bg/50 pl-9 pr-3 text-sm outline-none transition-colors focus:border-m3-primary focus:bg-m3-card focus:ring-2 focus:ring-m3-primary/20"
              />
            </label>

            <div className="flex flex-wrap items-center gap-1.5" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeSection === "all"}
                onClick={() => setActiveSection("all")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeSection === "all"
                    ? "bg-m3-primary text-white shadow-xs"
                    : "bg-m3-sidebar text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
                }`}
              >
                {t("home.dashboard.allSections")}
              </button>
              {allSections.map((sectionKey) => (
                <button
                  key={sectionKey}
                  type="button"
                  role="tab"
                  aria-selected={activeSection === sectionKey}
                  onClick={() => setActiveSection(sectionKey)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    activeSection === sectionKey
                      ? "bg-m3-primary text-white shadow-xs"
                      : "bg-m3-sidebar text-m3-secondary hover:bg-m3-hover hover:text-m3-text"
                  }`}
                >
                  {t(sectionKey as Parameters<typeof t>[0])}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[300px_1fr]">
          <div className="max-h-64 overflow-y-auto border-b border-m3-border/70 p-2.5 md:max-h-none md:border-b-0 md:border-r">
            {filteredWidgets.length === 0 ? (
              <p className="rounded-md border border-dashed border-m3-border bg-m3-sidebar/40 px-3 py-8 text-center text-caption">
                {t("home.dashboard.noMatchingWidgets")}
              </p>
            ) : (
              <ul className="space-y-1">
                {filteredWidgets.map((widget) => {
                  const selected = selectedWidget?.id === widget.id;
                  const unavailable = isAdded(widget);
                  return (
                    <li key={widget.id}>
                      <div
                        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors ${
                          selected
                            ? "border-m3-primary/40 bg-m3-primary-light/50"
                            : "border-transparent hover:bg-m3-hover/60"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(widget.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-sm font-medium text-m3-text">
                            {t(widget.title as Parameters<typeof t>[0])}
                          </p>
                          <p className="line-clamp-1 text-caption">
                            {t(widget.description as Parameters<typeof t>[0])}
                          </p>
                        </button>
                        <button
                          type="button"
                          disabled={unavailable}
                          onClick={() => {
                            setSelectedId(widget.id);
                            onAddWidget(widget.id);
                          }}
                          aria-label={
                            t("home.dashboard.add") +
                            " " +
                            t(widget.title as Parameters<typeof t>[0])
                          }
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            unavailable
                              ? "border-transparent text-m3-secondary/70"
                              : "border-m3-border bg-m3-card text-m3-text hover:border-m3-primary hover:text-m3-primary"
                          }`}
                        >
                          {unavailable ? (
                            <Check className="h-3.5 w-3.5" aria-hidden />
                          ) : (
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex min-h-0 flex-col bg-m3-bg/55">
            {selectedWidget && previewInstance && PreviewRenderer ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-m3-border/60 bg-m3-card/60 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-m3-text">
                        {t(selectedWidget.title as Parameters<typeof t>[0])}
                      </h3>
                      <Badge variant="neutral" size="sm">
                        {t(sectionKeyFor(selectedWidget) as Parameters<typeof t>[0])}
                      </Badge>
                      <Badge variant="neutral" size="sm" className="tabular-nums">
                        {selectedWidget.defaultSize.w} × {selectedWidget.defaultSize.h}
                      </Badge>
                    </div>
                    <p className="mt-1 text-caption">
                      {t(selectedWidget.description as Parameters<typeof t>[0])}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 items-center justify-center overflow-auto p-5">
                  <WidgetPreviewProvider apps={apps}>
                    <div
                      className="surface pointer-events-none w-full select-none overflow-hidden p-3.5 shadow-sm md:p-4"
                      style={{
                        maxWidth: previewWidth,
                        minHeight: previewMinHeight,
                      }}
                    >
                      <PreviewRenderer instance={previewInstance} />
                    </div>
                  </WidgetPreviewProvider>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-m3-border/70 bg-m3-card px-5 py-3">
                  <span className="text-caption">{t("home.dashboard.previewHint")}</span>
                  <Button
                    size="sm"
                    variant={isAdded(selectedWidget) ? "outline" : "primary"}
                    disabled={isAdded(selectedWidget)}
                    onClick={() => onAddWidget(selectedWidget.id)}
                    icon={
                      isAdded(selectedWidget) ? (
                        <Check className="h-4 w-4" aria-hidden />
                      ) : (
                        <Plus className="h-4 w-4" aria-hidden />
                      )
                    }
                  >
                    {isAdded(selectedWidget)
                      ? t("home.dashboard.added")
                      : t("home.dashboard.addWidget")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-caption">
                {t("home.dashboard.noMatchingWidgets")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
