import { Archive, CalendarDays, GripVertical, Minus, Pencil, Plus } from "lucide-react";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { Button } from "./ui/Button";
import { formatAmount } from "../lib/periods";
import { cn } from "../lib/utils";
import type { Action } from "../lib/types";

export type ActionDragHandleProps = {
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  setActivatorNodeRef?: (element: HTMLDivElement | null) => void;
  isDragging?: boolean;
};

type ActionItemProps = {
  action: Action;
  amount: number;
  dragHandleProps?: ActionDragHandleProps;
  onAdjust: (delta: number) => void;
  onArchive: () => void;
  onEdit: () => void;
  onOpenHistory: () => void;
  todayAmount: number;
  isAdjusting?: boolean;
  isArchiving?: boolean;
};

export function ActionItem({
  action,
  amount,
  dragHandleProps,
  onAdjust,
  onArchive,
  onEdit,
  onOpenHistory,
  todayAmount,
  isAdjusting,
  isArchiving,
}: ActionItemProps) {
  const isComplete = amount >= action.target_amount;
  const previousAmount = Math.max(0, amount - todayAmount);
  const previousProgress = Math.min(
    100,
    (previousAmount / action.target_amount) * 100,
  );
  const totalProgress = Math.min(100, (amount / action.target_amount) * 100);
  const shouldShowTodayDivider =
    previousAmount > 0 && todayAmount > 0 && totalProgress > previousProgress;
  const isCountDecrementUnavailable = amount <= 0 || todayAmount <= 0;

  return (
    <article className="grid h-full grid-cols-[18px_minmax(0,1fr)] gap-3 rounded-lg border border-stone-200 bg-white p-4 pl-2 shadow-sm shadow-stone-950/[0.03]">
      <div
        ref={dragHandleProps?.setActivatorNodeRef}
        className={cn(
          "flex min-h-10 touch-none select-none items-center justify-center pt-1 text-stone-300",
          dragHandleProps ? "cursor-grab active:cursor-grabbing" : "cursor-default",
          dragHandleProps?.isDragging && "text-stone-500",
        )}
        {...dragHandleProps?.attributes}
        {...dragHandleProps?.listeners}
        aria-hidden={dragHandleProps ? undefined : true}
        aria-label={dragHandleProps ? `${action.name} 순서 변경` : undefined}
      >
        <GripVertical size={17} />
      </div>
      <div className="flex min-w-0 flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="min-w-0 text-[17px] font-bold leading-snug">
                <span
                  className={cn(
                    "relative inline-block max-w-full whitespace-normal break-words align-bottom transition-colors duration-[180ms] [overflow-wrap:anywhere]",
                    isComplete
                      ? "text-stone-400 delay-[220ms]"
                      : "text-stone-950 delay-0",
                  )}
                >
                  {action.name}
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-x-0 top-1/2 h-0.5 origin-left -translate-y-1/2 bg-stone-400/90 transition-transform duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                      isComplete
                        ? "scale-x-100 delay-0"
                        : "scale-x-0 delay-[140ms]",
                    )}
                    aria-hidden
                  />
                </span>
              </h3>
            </div>
            <p className="mt-1.5 text-[15px] leading-5 text-stone-500">
              {formatCurrentAmount(amount, action.unit)} /{" "}
              {formatAmount(action.target_amount, action.unit)}
            </p>
          </div>
          <div className="-mr-2 flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${action.name} 수정`}
              onClick={onEdit}
            >
              <Pencil size={18} aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${action.name} 기록 보기`}
              onClick={onOpenHistory}
            >
              <CalendarDays size={18} aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`${action.name} 아카이브`}
              disabled={isArchiving}
              onClick={onArchive}
            >
              <Archive size={18} aria-hidden />
            </Button>
          </div>
        </div>

        <div
          className="relative mt-auto h-2 overflow-hidden rounded-full bg-stone-100"
          aria-label={`진행률 ${formatAmount(amount, action.unit)} 중 오늘 ${formatAmount(Math.min(todayAmount, amount), action.unit)}`}
        >
          <div
            className="absolute inset-y-0 left-0 w-full origin-left bg-violet-400 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
            style={{
              transform: `scaleX(${totalProgress / 100})`,
              willChange: "transform",
            }}
          />
          {shouldShowTodayDivider ? (
            <div
              className="absolute inset-y-0 w-px -translate-x-1/2 bg-white/75 shadow-[0_0_4px_rgb(255_255_255_/_0.45)]"
              style={{ left: `${previousProgress}%` }}
              aria-hidden
            />
          ) : null}
        </div>

        {action.unit === "count" ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              className={cn(
                "h-10",
                isAdjusting &&
                  !isCountDecrementUnavailable &&
                  "disabled:opacity-100",
              )}
              disabled={isAdjusting || isCountDecrementUnavailable}
              onClick={() => onAdjust(-1)}
            >
              <Minus size={16} aria-hidden />
            </Button>
            <Button
              type="button"
              variant="secondary"
              className={cn("h-10", isAdjusting && "disabled:opacity-100")}
              disabled={isAdjusting}
              onClick={() => onAdjust(1)}
            >
              <Plus size={16} aria-hidden />
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "-", delta: -30, icon: Minus },
              { label: "+", delta: 30, icon: Plus },
            ].map((control) => {
              const isControlUnavailable =
                amount + control.delta < 0 || todayAmount + control.delta < 0;

              return (
                <Button
                  key={control.label}
                  type="button"
                  variant="secondary"
                  disabled={isAdjusting || isControlUnavailable}
                  onClick={() => onAdjust(control.delta)}
                  className={cn(
                    "h-10 px-2",
                    isAdjusting &&
                      !isControlUnavailable &&
                      "disabled:opacity-100",
                  )}
                  aria-label={control.delta < 0 ? "30분 감소" : "30분 증가"}
                >
                  <control.icon size={16} aria-hidden />
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

function formatCurrentAmount(amount: number, unit: Action["unit"]) {
  if (unit === "count") {
    return String(amount);
  }

  const hours = amount / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}
