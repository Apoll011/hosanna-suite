"use client";
import "gridstack/dist/gridstack.min.css";
import { GridStack, type ComponentMap } from "gridstack/dist/react";
import type { GridStackOptions, GridStackWidget } from "gridstack";
import { useMemo } from "react";
import type { ComponentType } from "react";
import type { DashboardLayout, WidgetDefinition, WidgetInstance } from "../../core/types.js";
import type { WidgetRegistry } from "../../core/registry.js";
import type { WidgetRendererProps, WidgetRenderers } from "../../react/Dashboard.js";

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
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
  );
}

export function GridstackAdapter({
  layout,
  registry,
  renderers,
  onChange,
  onRemove,
  removeLabel = "Remove",
  getTitle,
}: {
  layout: DashboardLayout;
  registry: WidgetRegistry;
  renderers: WidgetRenderers;
  onChange: (layout: DashboardLayout) => void;
  onRemove?: (instanceId: string) => void;
  removeLabel?: string;
  getTitle?: (definition: WidgetDefinition) => string;
}) {
  const components = useMemo<ComponentMap>(() => {
    const entries = Object.entries(renderers) as [string, ComponentType<WidgetRendererProps>][];
    const output: ComponentMap = {};
    for (const [id, Renderer] of entries) {
      output[id] = function WidgetSlot(props) {
        const instance = props.instance;
        if (!isWidgetInstance(instance)) return null;
        const definition = registry.get(instance.widget);
        const title = definition && getTitle ? getTitle(definition) : instance.widget;
        return (
          <div className="surface relative h-full overflow-auto p-3 md:p-4 ring-1 ring-m3-primary/15">
            {onRemove ? (
              <button
                type="button"
                className="gs-no-drag absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-md text-m3-secondary transition-colors hover:bg-m3-danger/10 hover:text-m3-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-m3-primary"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(instance.instanceId);
                }}
                aria-label={`${removeLabel} ${title}`}
                title={removeLabel}
              >
                <CloseIcon />
              </button>
            ) : null}
            <Renderer instance={instance} />
          </div>
        );
      };
    }
    return output;
  }, [renderers, registry, onRemove, removeLabel, getTitle]);
  const options: GridStackOptions = useMemo(
    () => ({
      column: 12,
      cellHeight: 96,
      margin: 8,
      float: false,
      children: layout.items
        .filter((item) => registry.get(item.widget) && renderers[item.widget])
        .map((item) => {
          const definition = registry.get(item.widget);
          return {
            id: item.instanceId,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
            minW: definition?.minSize.w,
            minH: definition?.minSize.h,
            maxW: definition?.maxSize?.w,
            maxH: definition?.maxSize?.h,
            component: item.widget,
            props: { instance: item },
          };
        }),
    }),
    [layout.items, registry, renderers],
  );
  return (
    <div data-dashboard-gridstack>
      <style>
        {
          "[data-dashboard-gridstack] .grid-stack-item-content{overflow:visible!important;border-radius:var(--radius-lg)}[data-dashboard-gridstack] .grid-stack-placeholder>.placeholder-content{border:2px dashed var(--m3-primary);background-color:color-mix(in srgb,var(--m3-primary) 10%,transparent);border-radius:var(--radius-lg)}"
        }
      </style>
      <GridStack
        options={options}
        components={components}
        onChange={(_, nodes) => onChange(gridstackLayout(nodes, layout))}
      />
    </div>
  );
}

function isWidgetInstance(value: unknown): value is WidgetInstance {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return (
    "instanceId" in value &&
    typeof value.instanceId === "string" &&
    "widget" in value &&
    typeof value.widget === "string" &&
    "x" in value &&
    typeof value.x === "number" &&
    "y" in value &&
    typeof value.y === "number" &&
    "w" in value &&
    typeof value.w === "number" &&
    "h" in value &&
    typeof value.h === "number"
  );
}

export function gridstackLayout(
  items: readonly Pick<GridStackWidget, "id" | "x" | "y" | "w" | "h">[],
  layout: DashboardLayout,
): DashboardLayout {
  const byId = new Map(
    items
      .filter((item): item is typeof item & { id: string } => typeof item.id === "string")
      .map((item) => [item.id, item]),
  );
  return {
    ...layout,
    items: layout.items.map((item) => {
      const saved = byId.get(item.instanceId);
      return saved &&
        typeof saved.x === "number" &&
        typeof saved.y === "number" &&
        typeof saved.w === "number" &&
        typeof saved.h === "number"
        ? { ...item, x: saved.x, y: saved.y, w: saved.w, h: saved.h }
        : item;
    }),
  };
}
