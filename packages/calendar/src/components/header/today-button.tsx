// SPDX-License-Identifier: AGPL-3.0-only
import { formatDate } from "date-fns";

import { useCalendar } from "../../contexts/calendar-context";

export function TodayButton() {
  const { setSelectedDate } = useCalendar();

  const today = new Date();
  const handleClick = () => setSelectedDate(today);

  return (
    <button
      className="flex size-12 flex-col items-center justify-center overflow-hidden rounded-md border border-m3-border bg-m3-card text-m3-text hover:bg-m3-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary"
      onClick={handleClick}
    >
      <p className="flex pt-2 h-6 w-full items-center justify-center bg-m3-primary text-center text-xs font-semibold text-white">
        {formatDate(today, "MMM").toUpperCase()}
      </p>
      <p className="flex w-full items-center justify-center text-lg font-bold">{today.getDate()}</p>
    </button>
  );
}
