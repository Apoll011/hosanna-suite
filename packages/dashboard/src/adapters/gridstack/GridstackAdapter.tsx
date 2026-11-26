"use client";
import "gridstack/dist/gridstack.min.css";
import { GridStack, type ComponentMap } from "gridstack/dist/react";
import type { GridStackOptions, GridStackWidget } from "gridstack";
import { useMemo } from "react";
import type { ComponentType } from "react";
import type { DashboardLayout, WidgetInstance } from "../../core/types.js";
import type { WidgetRegistry } from "../../core/registry.js";
import type { WidgetRendererProps, WidgetRenderers } from "../../react/Dashboard.js";

export function GridstackAdapter({
  layout,
  registry,
  renderers,
  onChange,
}: {
  layout: DashboardLayout;
  registry: WidgetRegistry;
  renderers: WidgetRenderers;
  onChange: (layout: DashboardLayout) => void;
}) {
  const components = useMemo<ComponentMap>(() => {
    const entries = Object.entries(renderers) as [string, ComponentType<WidgetRendererProps>][];
    const output: ComponentMap = {};
    for (const [id, Renderer] of entries) {
      output[id] = function WidgetSlot(props) {
        const instance = props.instance;
        if (!isWidgetInstance(instance)) return null;
        return (
          <div className="h-full overflow-auto p-4">
            <Renderer instance={instance} />
          </div>
        );
      };
    }
    return output;
  }, [renderers]);
  const options: GridStackOptions = useMemo(
    () => ({
      column: 12,
      cellHeight: 144,
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
    <GridStack
      options={options}
      components={components}
      onChange={(_, nodes) => onChange(gridstackLayout(nodes, layout))}
    />
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
