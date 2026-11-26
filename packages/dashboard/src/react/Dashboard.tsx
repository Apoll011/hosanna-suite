"use client";
import { Component, type ComponentType, type ReactNode } from "react";
import { mobileOrder } from "../core/normalization.js";
import type { DashboardLayout, WidgetInstance } from "../core/types.js";
import type { WidgetRegistry } from "../core/registry.js";

export type WidgetRendererProps = { instance: WidgetInstance };
export type WidgetRenderers = Readonly<Record<string, ComponentType<WidgetRendererProps>>>;

export function Dashboard({
  layout,
  registry,
  renderers,
  onRemove,
  editable = false,
}: {
  layout: DashboardLayout;
  registry: WidgetRegistry;
  renderers: WidgetRenderers;
  onRemove?: (instanceId: string) => void;
  editable?: boolean;
}) {
  const visible = layout.items.filter((item) => !layout.hidden.includes(item.widget));
  const mobile = mobileOrder({ ...layout, items: visible });
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-[minmax(9rem,auto)]" data-dashboard-view>
      {mobile.map((instance) => {
        const definition = registry.get(instance.widget);
        const Renderer = renderers[instance.widget];
        if (!definition || !Renderer) return null;
        return (
          <section
            key={instance.instanceId}
            className="surface relative min-w-0 overflow-hidden p-4 md:p-5"
            style={{ gridColumn: "span " + Math.min(instance.w, 12), gridRow: "span " + Math.max(1, instance.h) }}
            aria-label={definition.title}
            data-widget={instance.widget}
          >
            {editable && onRemove ? (
              <button type="button" className="absolute right-3 top-3 rounded-md p-2 text-m3-secondary hover:bg-m3-hover" onClick={() => onRemove(instance.instanceId)} aria-label={"Remove " + definition.title}>
                Remove
              </button>
            ) : null}
            <WidgetErrorBoundary>
              <Renderer instance={instance} />
            </WidgetErrorBoundary>
          </section>
        );
      })}
    </div>
  );
}

class WidgetErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) return <div role="alert" className="text-sm text-m3-danger">This widget could not be loaded.</div>;
    return this.props.children;
  }
}
