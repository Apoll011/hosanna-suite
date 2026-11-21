import type { TEventColor } from "./types";

export type TEventId = string | number;

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface IEvent {
  id: TEventId;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
}

export type TEventDraft = Omit<IEvent, "id"> & { id?: TEventId };

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
