import { Archive, Check, Minus, Plus } from "lucide-react";
import { Button } from "./ui/Button";
import { formatAmount } from "../lib/periods";
import { cn } from "../lib/utils";
import type { Action } from "../lib/types";

type ActionItemProps = {
  action: Action;
  amount: number;
  onAdjust: (delta: number) => void;
  onArchive: () => void;
  onOpenHistory: () => void;
  todayAmount: number;
  isAdjusting?: boolean;
  isArchiving?: boolean;
};

export function ActionItem({
  action,
  amount,
  onAdjust,
  onArchive,
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

  return (
    <article className="grid gap-3 py-4 max-[719px]:border-b max-[719px]:border-stone-200 max-[719px]:last:border-b-0 min-[720px]:rounded-lg min-[720px]:border min-[720px]:border-stone-200 min-[720px]:bg-white min-[720px]:p-4 min-[720px]:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          className="-m-2 min-w-0 flex-1 rounded-md p-2 text-left outline-none transition hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          onClick={onOpenHistory}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  "truncate text-base font-semibold",
                  isComplete
                    ? "text-stone-400 line-through decoration-stone-300"
                    : "text-stone-950",
                )}
              >
                {action.name}
              </h3>
              {isComplete ? (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={15} aria-label="목표 달성" />
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-stone-500">
              {formatAmount(amount, action.unit)} /{" "}
              {formatAmount(action.target_amount, action.unit)}
            </p>
          </div>
        </button>
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

      <div
        className="relative h-2 overflow-hidden rounded-full bg-stone-100"
        aria-label={`진행률 ${formatAmount(amount, action.unit)} 중 오늘 ${formatAmount(Math.min(todayAmount, amount), action.unit)}`}
      >
        <div
          className="absolute inset-y-0 left-0 w-full origin-left bg-emerald-300 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
          style={{
            transform: `scaleX(${totalProgress / 100})`,
            willChange: "transform",
          }}
        />
        <div
          className="absolute inset-y-0 left-0 w-full origin-left bg-emerald-600 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
          style={{
            transform: `scaleX(${previousProgress / 100})`,
            willChange: "transform",
          }}
        />
      </div>

      {action.unit === "count" ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-9"
            disabled={isAdjusting || amount <= 0 || todayAmount <= 0}
            onClick={() => onAdjust(-1)}
          >
            <Minus size={16} aria-hidden />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-9"
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
          ].map((control) => (
            <Button
              key={control.label}
              type="button"
              variant="secondary"
              disabled={
                isAdjusting ||
                amount + control.delta < 0 ||
                todayAmount + control.delta < 0
              }
              onClick={() => onAdjust(control.delta)}
              className="h-9 px-2"
              aria-label={control.delta < 0 ? "30분 감소" : "30분 증가"}
            >
              <control.icon size={16} aria-hidden />
            </Button>
          ))}
        </div>
      )}
    </article>
  );
}
