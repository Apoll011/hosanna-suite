"use client";
import "gridstack/dist/gridstack.min.css";
import { GridStack } from "gridstack/dist/react";
import type { GridStackOptions, GridStackWidget } from "gridstack";
import { useGridStack } from "gridstack/dist/react";
import { useEffect, useMemo } from "react";
import type { ComponentType } from "react";
import type { DashboardLayout, WidgetInstance } from "../../core/types.js";
import type { WidgetRegistry } from "../../core/registry.js";
import type { WidgetRendererProps, WidgetRenderers } from "../../react/Dashboard.js";

function ChangeBridge({ onChange, layout, registry }: { onChange: (layout: DashboardLayout) => void; layout: DashboardLayout; registry: WidgetRegistry }) {
  const { grid } = useGridStack();
  useEffect(() => {
    if (!grid) return;
    const update = () => {
      const saved = grid.save(false, false);
      if (!Array.isArray(saved)) return;
      const items: WidgetInstance[] = saved.flatMap((widget) => {
        const instanceId = typeof widget.id === "string" ? widget.id : "";
        const old = layout.items.find((item) => item.instanceId === instanceId);
        if (!old || typeof widget.x !== "number" || typeof widget.y !== "number" || typeof widget.w !== "number" || typeof widget.h !== "number") return [];
        return [{ ...old, x: widget.x, y: widget.y, w: widget.w, h: widget.h }];
      });
      onChange({ ...layout, items });
    };
    grid.on("change", update);
    return () => { grid.off("change", update); };
  }, [grid, layout, onChange, registry]);
  return null;
}

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
  const components = useMemo(() => Object.fromEntries(
    Object.entries(renderers).map(([id, Renderer]) => [id, function WidgetSlot({ instance }: WidgetRendererProps) {
      return <div className="h-full overflow-auto p-4"><Renderer instance={instance} /></div>;
    }]),
  ) as Record<string, ComponentType<WidgetRendererProps>>, [renderers]);
  const options: GridStackOptions = useMemo(() => ({
    column: 12,
    cellHeight: 144,
    margin: 8,
    float: false,
    children: layout.items.filter((item) => registry.get(item.widget) && renderers[item.widget]).map((item) => {
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
  }), [layout.items, registry, renderers]);
  return <GridStack options={options} components={components}><ChangeBridge onChange={onChange} layout={layout} registry={registry} /></GridStack>;
}

export function gridstackLayout(items: readonly GridStackWidget[], layout: DashboardLayout): DashboardLayout {
  const byId = new Map(items.filter((item) => typeof item.id === "string").map((item) => [item.id!, item]));
  return { ...layout, items: layout.items.map((item) => {
    const saved = byId.get(item.instanceId);
    return saved && typeof saved.x === "number" && typeof saved.y === "number" && typeof saved.w === "number" && typeof saved.h === "number"
      ? { ...item, x: saved.x, y: saved.y, w: saved.w, h: saved.h }
      : item;
  }) };
}
