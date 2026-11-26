"use client";
import type { WidgetConfigDefinition } from "../core/types.js";

export function WidgetConfiguration({
  definition,
  value,
  onChange,
  label,
}: {
  definition: WidgetConfigDefinition;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  label?: (field: string) => string;
}) {
  const fields = Object.entries(definition.schema?.fields ?? {});
  if (fields.length === 0) return null;
  return (
    <fieldset className="space-y-3">
      {fields.map(([key, field]) => (
        <label key={key} className="flex items-center justify-between gap-3 text-sm">
          <span>{label?.(field.label ?? key) ?? field.label ?? key}</span>
          {field.type === "boolean" ? (
            <input
              type="checkbox"
              checked={value[key] === true}
              onChange={(event) => onChange({ ...value, [key]: event.currentTarget.checked })}
            />
          ) : field.enum ? (
            <select
              className="min-h-10 rounded-md border border-m3-border bg-m3-card px-3"
              value={String(value[key] ?? definition.defaults?.[key] ?? "")}
              onChange={(event) => onChange({ ...value, [key]: field.type === "number" ? Number(event.currentTarget.value) : event.currentTarget.value })}
            >
              {field.enum.map((option) => <option key={String(option)} value={option}>{String(option)}</option>)}
            </select>
          ) : (
            <input
              className="min-h-10 w-28 rounded-md border border-m3-border bg-m3-card px-3"
              type={field.type === "number" ? "number" : "text"}
              min={field.min}
              max={field.max}
              value={String(value[key] ?? definition.defaults?.[key] ?? "")}
              onChange={(event) => onChange({ ...value, [key]: field.type === "number" ? Number(event.currentTarget.value) : event.currentTarget.value })}
            />
          )}
        </label>
      ))}
    </fieldset>
  );
}
