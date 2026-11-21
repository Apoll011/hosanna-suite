export type TEventId = string;

export interface IResponsibilityAssignee {
  id: string;
  name: string;
  memberId?: string;
  avatarUrl?: string | null;
  notified?: boolean;
}

export interface IResponsibility {
  id: string;
  categoryId: string;
  assignees: IResponsibilityAssignee[];
}

export interface IReminderSettings {
  enabled: boolean;
  label: string;
}

export interface IAgendaEvent {
  id: TEventId;
  date: string;
  title: string;
  type: string;
  time: string;
  durationMinutes: number;
  location?: string | null;
  notes?: string | null;
  reminder: IReminderSettings;
  linkedServiceId?: string | null;
  responsibilities: IResponsibility[];
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  purgeAt?: string | null;
}

export type TEventDraft = Omit<IAgendaEvent, "id"> & { id?: TEventId };

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
