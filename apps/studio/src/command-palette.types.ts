import React from "react";

export type ActionSection = string;

export interface CommandAction {
  id: string;
  name: string;
  subtitle?: string;
  badge?: string;
  shortcut?: string[]; // e.g., ["g", "d"] or ["c", "s"] or ["Ctrl", "k"]
  keywords?: string;
  section?: ActionSection;
  icon?: string | React.ReactElement | React.ReactNode;
  parent?: string; // ID of parent for nested actions (e.g., "search-songs-sub")
  perform?: () => void | Promise<void>;
  isLoading?: boolean;
}
