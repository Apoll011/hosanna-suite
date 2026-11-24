// SPDX-License-Identifier: AGPL-3.0-only
export { Calendar, type CalendarProps } from "./components/calendar";
export {
  CalendarProvider,
  useCalendar,
  type CalendarProviderProps,
} from "./contexts/calendar-context";
export { useUpdateEvent } from "./hooks/use-update-event";
export { eventSchema, type TEventFormData } from "./schemas";
export * from "./helpers";
export * from "./interfaces";
export * from "./types";

export { CalendarAgendaView } from "./components/agenda-view/calendar-agenda-view";
export { CalendarDayView } from "./components/week-and-day-view/calendar-day-view";
export { SideMonthCalendar } from "./components/week-and-day-view/side-month-calendar";
export { CalendarWeekView } from "./components/week-and-day-view/calendar-week-view";
export { CalendarMonthView } from "./components/month-view/calendar-month-view";
export { CalendarYearView } from "./components/year-view/calendar-year-view";

export { EventFormModal, type EventFormModalProps } from "./components/dialogs/event-form-modal";
export { ServiceLinkField, serviceTotalMinutes } from "./components/dialogs/service-link-field";
export { AvatarStack } from "./components/common/avatar-stack";
export { ICON_MAP, COLOR_MAP, getAvatarGradient, getInitials } from "./utils/icon-map";
