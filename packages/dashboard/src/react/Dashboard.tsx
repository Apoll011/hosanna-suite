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
      className="grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-[minmax(9rem,auto)]"
      data-dashboard-view
    >
      <style>
        {
          "[data-dashboard-view] [data-widget-instance]{grid-column:1/-1}@media(min-width:768px){[data-dashboard-view] [data-widget-instance]{grid-column:span var(--dashboard-columns)}}"
        }
      </style>
      {mobile.map((instance) => {
        const definition = registry.get(instance.widget);
        const Renderer = renderers[instance.widget];
        if (!definition || !Renderer) return null;
        return (
          <section
            key={instance.instanceId}
            className="surface relative min-w-0 overflow-hidden p-4 md:p-5"
            style={
              {
                gridRow: "span " + Math.max(1, instance.h),
                "--dashboard-columns": Math.min(instance.w, 12),
              } as CSSProperties
            }
            aria-label={getTitle(definition)}
            data-widget={instance.widget}
            data-widget-instance
          >
            {editable && onRemove ? (
              <button
                type="button"
                className="absolute right-3 top-3 rounded-md p-2 text-m3-secondary hover:bg-m3-hover"
                onClick={() => onRemove(instance.instanceId)}
                aria-label={removeLabel + " " + getTitle(definition)}
              >
                {removeLabel}
              </button>
            ) : null}
            <WidgetErrorBoundary errorLabel={errorLabel}>
              <Renderer instance={instance} />
            </WidgetErrorBoundary>
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
