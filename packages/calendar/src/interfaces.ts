import type { TEventColor } from "./types";

export type TEventId = string | number;

export type ResponsibilityColor =
  "amber" | "violet" | "sky" | "rose" | "emerald" | "cyan" | "slate" | "indigo";

export type ResponsibilityIconKey =
  | "mic"
  | "music"
  | "volume"
  | "light"
  | "monitor"
  | "book"
  | "heart"
  | "users"
  | "camera"
  | "custom";

export interface Assignee {
  id?: string;
  name: string;
  memberId?: string;
  avatarUrl?: string | null;
  email?: string;
}

export interface Responsibility {
  id: string;
  categoryId: string;
  assignees: Assignee[];
}

export interface ResponsibilityCategory {
  id: string;
  label: string;
  color?: string;
  icon?: string;
  defaultAssignees?: string[];
  position?: number;
}

export interface ServiceElement {
  id?: string;
  title?: string;
  duration?: number;
}

export interface Service {
  id: string;
  name: string;
  date: string;
  archived?: boolean;
  notes?: string | null;
  elements?: ServiceElement[];
}

export interface EventFormValue {
  title: string;
  type: string;
  date: string;
  time: string;
  durationMinutes: number;
  location: string;
  notes: string;
  color?: TEventColor;
  linkedServiceId: string | null;
}

export interface ReminderSettings {
  enabled: boolean;
  label: string;
}

export interface IUser {
  id: string;
  name: string;
  picturePath?: string | null;
  avatarUrl?: string | null;
}

export interface AgendaEvent {
  id: string;
  date: string;
  time: string;
  durationMinutes: number;
  title: string;
  type: string;
  location?: string | null;
  notes?: string | null;
  color?: TEventColor | null;
  reminder?: ReminderSettings;
  linkedServiceId?: string | null;
  responsibilities: Responsibility[];
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  purgeAt?: string | null;

  startDate?: string;
  endDate?: string;
  description?: string;
  user?: IUser;
}

export type IEvent = AgendaEvent;

export type TEventDraft = Partial<AgendaEvent>;

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
