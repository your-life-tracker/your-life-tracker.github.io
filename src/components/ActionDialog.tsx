import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { SegmentedControl } from "./ui/SegmentedControl";
import type { ActionPeriod, ActionUnit } from "../lib/types";

type ActionDialogProps = {
  open: boolean;
  onClose: () => void;
  onExit: () => void;
  onCreate: (input: {
    name: string;
    period: ActionPeriod;
    unit: ActionUnit;
    targetAmount: number;
  }) => Promise<unknown>;
};

export function ActionDialog({
  open,
  onClose,
  onExit,
  onCreate,
}: ActionDialogProps) {
  const [name, setName] = useState("");
  const [period, setPeriod] = useState<ActionPeriod>("weekly");
  const [unit, setUnit] = useState<ActionUnit>("count");
  const [target, setTarget] = useState(3);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const targetStep = unit === "minutes" ? 0.5 : 1;
  const minimumTarget = unit === "minutes" ? 0.5 : 1;
  const targetLabel = unit === "minutes" ? `${target}시간` : `${target}회`;

  useEffect(() => {
    if (!open) {
      const timeout = window.setTimeout(onExit, 160);
      return () => window.clearTimeout(timeout);
    }
  }, [onExit, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("이름을 입력하세요.");
      return;
    }
    if (target < minimumTarget) {
      setError("목표량은 0보다 큰 숫자여야 합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        period,
        unit,
        targetAmount: unit === "minutes" ? Math.round(target * 60) : target,
      });
      onClose();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "액션을 생성하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-950/35 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content className="fixed inset-x-4 top-4 z-50 max-h-[calc(100svh-32px)] overflow-y-auto rounded-lg border border-stone-200 bg-white p-5 shadow-xl outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-32px)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-stone-950">
                액션 생성
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-stone-500">
                어떤 행동을 얼마나 자주 실천할지 정해보세요.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="닫기">
                <X size={18} aria-hidden />
              </Button>
            </Dialog.Close>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-stone-700">
              이름
              <Input
                className="mt-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: 운동, 독서, 공부"
              />
            </label>

            <div>
              <span className="text-sm font-medium text-stone-700">주기</span>
              <div className="mt-2">
                <SegmentedControl
                  value={period}
                  onChange={setPeriod}
                  options={[
                    { label: "주간", value: "weekly" },
                    { label: "월간", value: "monthly" },
                  ]}
                />
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-stone-700">단위</span>
              <div className="mt-2">
                <SegmentedControl
                  value={unit}
                  onChange={(nextUnit) => {
                    setUnit(nextUnit);
                    setTarget(nextUnit === "minutes" ? 5 : 3);
                  }}
                  options={[
                    { label: "횟수", value: "count" },
                    { label: "시간", value: "minutes" },
                  ]}
                />
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-stone-700">
                목표량 {unit === "minutes" ? "(시간)" : "(횟수)"}
              </span>
              <div className="mt-2 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center overflow-hidden rounded-md border border-stone-200 bg-white">
                <button
                  type="button"
                  className="flex h-11 items-center justify-center text-stone-700 transition hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-35"
                  aria-label="목표량 감소"
                  disabled={target <= minimumTarget}
                  onClick={() =>
                    setTarget((current) =>
                      Math.max(minimumTarget, current - targetStep),
                    )
                  }
                >
                  <Minus size={18} aria-hidden />
                </button>
                <div className="flex h-11 min-w-0 items-center justify-center border-x border-stone-200 px-3 text-sm font-semibold text-stone-950">
                  {targetLabel}
                </div>
                <button
                  type="button"
                  className="flex h-11 items-center justify-center text-stone-700 transition hover:bg-stone-100"
                  aria-label="목표량 증가"
                  onClick={() => setTarget((current) => current + targetStep)}
                >
                  <Plus size={18} aria-hidden />
                </button>
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">
                  취소
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "생성 중..." : "생성"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
