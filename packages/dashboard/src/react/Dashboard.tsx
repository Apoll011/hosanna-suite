"use client";
import { Component, type ComponentType, type ReactNode, type CSSProperties } from "react";
import { mobileOrder } from "../core/normalization.js";
import type { DashboardLayout, WidgetInstance } from "../core/types.js";
import type { WidgetDefinition } from "../core/types.js";
import type { WidgetRegistry } from "../core/registry.js";

export type WidgetRendererProps = { instance: WidgetInstance };
export type WidgetRenderers = Readonly<Record<string, ComponentType<WidgetRendererProps>>>;

export function Dashboard({
  layout,
  registry,
  renderers,
  onRemove,
  editable = false,
  removeLabel,
  errorLabel,
  getTitle,
}: {
  layout: DashboardLayout;
  registry: WidgetRegistry;
  renderers: WidgetRenderers;
  onRemove?: (instanceId: string) => void;
  editable?: boolean;
  removeLabel: string;
  errorLabel: string;
  getTitle: (definition: WidgetDefinition) => string;
}) {
  const visible = layout.items.filter((item) => !layout.hidden.includes(item.widget));
  const mobile = mobileOrder({ ...layout, items: visible });
  return (
    <div
      className="grid grid-cols-1 gap-3 md:grid-cols-12 md:auto-rows-[minmax(6rem,auto)]"
      data-dashboard-view
    >
      <style>
        {
          "[data-dashboard-view] [data-widget-instance]{grid-column:1/-1;grid-row:auto!important}@media(min-width:768px){[data-dashboard-view] [data-widget-instance]{grid-column:var(--dashboard-column-start)/span var(--dashboard-columns);grid-row:var(--dashboard-row-start)/span var(--dashboard-row-span)!important}}"
        }
      </style>
      {mobile.map((instance) => {
        const definition = registry.get(instance.widget);
        const Renderer = renderers[instance.widget];
        if (!definition || !Renderer) return null;
        return (
          <section
            key={instance.instanceId}
            className={`surface relative min-w-0 p-3 md:p-4 ${
              editable ? "overflow-visible ring-1 ring-m3-primary/20" : "overflow-hidden"
            }`}
            style={
              {
                "--dashboard-column-start": instance.x + 1,
                "--dashboard-columns": Math.min(instance.w, 12),
                "--dashboard-row-start": instance.y + 1,
                "--dashboard-row-span": Math.max(1, instance.h),
              } as CSSProperties
            }
            aria-label={getTitle(definition)}
            data-widget={instance.widget}
            data-widget-instance
          >
            {editable && onRemove ? (
              <button
                type="button"
                className="absolute -right-2 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-m3-border bg-m3-card text-m3-secondary shadow-sm transition-colors hover:border-m3-danger hover:bg-m3-danger hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m3-primary"
                onClick={() => onRemove(instance.instanceId)}
                aria-label={removeLabel + " " + getTitle(definition)}
                title={removeLabel}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            ) : null}
            <div className={editable ? "h-full pointer-events-none select-none" : "h-full"}>
              <WidgetErrorBoundary errorLabel={errorLabel}>
                <Renderer instance={instance} />
              </WidgetErrorBoundary>
            </div>
          </section>
        );
      })}
    </div>
  );
}

class WidgetErrorBoundary extends Component<
  { children: ReactNode; errorLabel: string },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    if (this.state.error)
      return (
        <div role="alert" className="text-sm text-m3-danger">
          {this.props.errorLabel}
        </div>
      );
    return this.props.children;
  }
}
