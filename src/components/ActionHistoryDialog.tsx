import * as Dialog from "@radix-ui/react-dialog";
import {
  addMonths,
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isAfter,
  isBefore,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useActionDailyEntriesQuery,
  useActionFirstDailyEntryQuery,
} from "../hooks/useActions";
import {
  formatAmount,
  formatCalendarMonth,
  toDateKey,
} from "../lib/periods";
import type { Action } from "../lib/types";
import { Button } from "./ui/Button";

type ActionHistoryDialogProps = {
  action: Action;
  userId: string;
  isGuest?: boolean;
  open: boolean;
  onClose: () => void;
  onExit: () => void;
};

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

function formatTargetSummary(action: Action) {
  const periodLabel = action.period === "weekly" ? "주" : "월";

  if (action.unit === "count") {
    return `${periodLabel} ${action.target_amount}회`;
  }

  const hours = action.target_amount / 60;
  const formattedHours = Number.isInteger(hours) ? hours : hours.toFixed(1);
  return `${periodLabel} ${formattedHours}시간`;
}

export function ActionHistoryDialog({
  action,
  userId,
  isGuest = false,
  open,
  onClose,
  onExit,
}: ActionHistoryDialogProps) {
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const currentMonth = useMemo(() => startOfMonth(new Date()), []);
  const isViewingCurrentMonth = isSameMonth(monthDate, currentMonth);
  const targetSummary = useMemo(() => formatTargetSummary(action), [action]);
  const firstDailyEntryQuery = useActionFirstDailyEntryQuery(
    userId,
    action.id,
    isGuest,
  );
  const startDate = useMemo(
    () =>
      firstDailyEntryQuery.data
        ? parseISO(firstDailyEntryQuery.data.entry_date)
        : null,
    [firstDailyEntryQuery.data],
  );
  const startMonth = useMemo(
    () => (startDate ? startOfMonth(startDate) : null),
    [startDate],
  );
  const isViewingStartMonth =
    startMonth !== null && isSameMonth(monthDate, startMonth);
  const isPreviousDisabled =
    firstDailyEntryQuery.isLoading || startMonth === null || isViewingStartMonth;
  const dailyEntriesQuery = useActionDailyEntriesQuery(
    userId,
    action.id,
    monthDate,
    isGuest,
  );
  const amountByDate = useMemo(
    () =>
      new Map(
        (dailyEntriesQuery.data ?? []).map((entry) => [
          entry.entry_date,
          entry.amount,
        ]),
      ),
    [dailyEntriesQuery.data],
  );
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const minimumCalendarEnd = addDays(calendarStart, 41);
    const monthCalendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({
      start: calendarStart,
      end:
        monthCalendarEnd > minimumCalendarEnd
          ? monthCalendarEnd
          : minimumCalendarEnd,
    });
  }, [monthDate]);

  useEffect(() => {
    if (!open) {
      const timeout = window.setTimeout(onExit, 160);
      return () => window.clearTimeout(timeout);
    }
  }, [onExit, open]);

  useEffect(() => {
    if (isAfter(monthDate, currentMonth)) {
      setMonthDate(currentMonth);
      return;
    }

    if (startMonth !== null && isBefore(monthDate, startMonth)) {
      setMonthDate(startMonth);
    }
  }, [currentMonth, monthDate, startMonth]);

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-950/35 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content className="fixed inset-x-2 top-2 z-50 max-h-[calc(100svh-16px)] overflow-y-auto rounded-lg border border-stone-200 bg-white p-4 shadow-xl shadow-stone-950/10 outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-32px)] sm:max-w-lg sm:max-h-[calc(100svh-32px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title className="text-[19px] font-bold leading-snug text-stone-950">
                {action.name} ({targetSummary})
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 space-y-1 text-sm text-stone-500">
                <span className="block text-[12px] leading-5 text-stone-400">
                  최초 시작일:{" "}
                  {startDate ? format(startDate, "yyyy년 M월 d일") : "-"}
                </span>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="닫기">
                <X size={18} aria-hidden />
              </Button>
            </Dialog.Close>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="이전 달"
              disabled={isPreviousDisabled}
              onClick={() =>
                setMonthDate((current) => {
                  if (startMonth === null) return current;

                  const previousMonth = subMonths(current, 1);
                  return isBefore(previousMonth, startMonth)
                    ? startMonth
                    : previousMonth;
                })
              }
            >
              <ChevronLeft size={18} aria-hidden />
            </Button>
            <div className="text-[16px] font-bold text-stone-950">
              {formatCalendarMonth(monthDate)}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="다음 달"
              disabled={isViewingCurrentMonth}
              onClick={() =>
                setMonthDate((current) => {
                  const nextMonth = addMonths(current, 1);
                  return isAfter(nextMonth, currentMonth)
                    ? currentMonth
                    : nextMonth;
                })
              }
            >
              <ChevronRight size={18} aria-hidden />
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 max-[719px]:gap-0.5">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="flex h-8 min-w-0 items-center justify-center text-xs font-medium text-stone-500 max-[719px]:h-7"
              >
                {weekday}
              </div>
            ))}
            {calendarDays.map((day) => {
              const dayKey = toDateKey(day);
              const amount = amountByDate.get(dayKey) ?? 0;
              const isInMonth = isSameMonth(day, monthDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dayKey}
                  className="flex aspect-square min-h-14 min-w-0 flex-col rounded-md border border-stone-100 bg-stone-50 p-1.5 max-[719px]:min-h-10 max-[719px]:rounded-sm max-[719px]:p-1 max-[360px]:min-h-9"
                >
                  <span
                    className={
                      isTodayDate
                        ? "relative inline-flex h-4 w-fit shrink-0 items-start self-start text-xs font-medium leading-none text-stone-950 after:absolute after:left-0 after:top-[14px] after:h-0.5 after:w-full after:bg-red-500"
                        : isInMonth
                          ? "inline-flex h-4 w-fit shrink-0 items-start self-start text-xs font-medium leading-none text-stone-700"
                          : "inline-flex h-4 w-fit shrink-0 items-start self-start text-xs font-medium leading-none text-stone-300"
                    }
                  >
                    {format(day, "d")}
                  </span>
                  {amount > 0 ? (
                    <span className="mt-auto w-full min-w-0 whitespace-nowrap rounded bg-emerald-100 px-1.5 py-0.5 text-center text-[11px] font-semibold leading-tight text-emerald-800 max-[719px]:px-0.5 max-[719px]:text-[10px] max-[360px]:text-[9px]">
                      {formatAmount(amount, action.unit)}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-4 min-h-5" aria-hidden />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
