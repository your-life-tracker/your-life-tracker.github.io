import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { ko } from "date-fns/locale";
import type { ActionPeriod } from "./types";

export type PeriodRange = {
  start: Date;
  end: Date;
  startKey: string;
  endKey: string;
};

export function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function getCurrentPeriod(period: ActionPeriod, now = new Date()) {
  const start =
    period === "weekly"
      ? startOfWeek(now, { weekStartsOn: 1 })
      : startOfMonth(now);
  const end =
    period === "weekly" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);

  return {
    start,
    end,
    startKey: toDateKey(start),
    endKey: toDateKey(end),
  };
}

export function getPreviousPeriodStart(period: ActionPeriod, date: Date) {
  return period === "weekly" ? subWeeks(date, 1) : subMonths(date, 1);
}

export function getNextPeriodStart(period: ActionPeriod, date: Date) {
  return period === "weekly" ? addWeeks(date, 1) : addMonths(date, 1);
}

export function formatWeeklyRange(range: PeriodRange) {
  return `${format(range.start, "yyyy년 M월 d일", { locale: ko })} ~ ${format(
    range.end,
    "yyyy년 M월 d일",
    { locale: ko },
  )}`;
}

export function formatMonthlyRange(range: PeriodRange) {
  return format(range.start, "yyyy년 M월", { locale: ko });
}

export function formatCalendarMonth(date: Date, now = new Date()) {
  const pattern = date.getFullYear() === now.getFullYear() ? "M월" : "yyyy년 M월";
  return format(date, pattern, { locale: ko });
}

export function formatAmount(amount: number, unit: "count" | "minutes") {
  if (unit === "count") {
    return `${amount}회`;
  }

  const hours = amount / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}
