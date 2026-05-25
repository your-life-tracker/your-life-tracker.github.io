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
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useActionDailyEntriesQuery } from "../hooks/useActions";
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
    }
  }, [currentMonth, monthDate]);

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-950/35 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100svh-32px)] w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-stone-200 bg-white p-5 shadow-xl outline-none max-[719px]:max-h-[calc(100svh-16px)] max-[719px]:w-[calc(100%-16px)] max-[719px]:p-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-stone-950">
                기록 조회
              </Dialog.Title>
              <Dialog.Description className="mt-1 truncate text-sm text-stone-500">
                {action.name}
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
              onClick={() => setMonthDate((current) => subMonths(current, 1))}
            >
              <ChevronLeft size={18} aria-hidden />
            </Button>
            <div className="text-base font-semibold text-stone-950">
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
                        ? "w-fit border-b-2 border-red-500 pb-0.5 text-xs font-semibold leading-none text-stone-950"
                        : isInMonth
                          ? "text-xs font-medium text-stone-700"
                          : "text-xs font-medium text-stone-300"
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

          <div className="mt-4 min-h-5 text-center text-sm text-stone-500">
            {dailyEntriesQuery.isFetching ? "기록을 불러오는 중..." : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
