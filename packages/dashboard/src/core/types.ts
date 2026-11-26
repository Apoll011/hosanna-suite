export type GridSize = { w: number; h: number };
export type ConfigField = {
  type: "string" | "number" | "boolean";
  label?: string;
  enum?: readonly (string | number | boolean)[];
  min?: number;
  max?: number;
};
export type WidgetConfigDefinition = {
  version?: number;
  defaults?: Record<string, unknown>;
  schema?: { fields: Record<string, ConfigField> };
  migrations?: readonly {
    from: number;
    to: number;
    renameFields?: Readonly<Record<string, string>>;
    defaults?: Record<string, unknown>;
  }[];
};
export type WidgetDefinition = {
  id: string;
  app: string;
  title: string;
  description: string;
  icon: string;
  minSize: GridSize;
  defaultSize: GridSize;
  maxSize?: GridSize;
  defaultFor?: readonly { role: string; priority: number }[];
  requires?: readonly string[];
  singleton?: boolean;
  enabled?: boolean;
  group?: string;
  searchPatterns?: readonly string[];
  config?: WidgetConfigDefinition;
};
export type WidgetInstance = {
  instanceId: string;
  widget: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
  configVersion?: number;
  [extra: string]: unknown;
};
export type DashboardLayout = {
  version: number;
  items: WidgetInstance[];
  hidden: string[];
  seen: string[];
  [extra: string]: unknown;
};
export type DashboardContext = {
  permissions: readonly string[];
  orgRole: string | null;
  apps: readonly { id: string; status?: string; accessible?: boolean }[];
};
export type DashboardPersistence = {
  load: (organizationId: string) => Promise<unknown | null>;
  save: (organizationId: string, layout: DashboardLayout) => Promise<void>;
};
