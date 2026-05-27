import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { SegmentedControl } from "./ui/SegmentedControl";
import type { Action } from "../lib/types";

type EditActionDialogProps = {
  action: Action;
  open: boolean;
  onClose: () => void;
  onExit: () => void;
  onEdit: (input: { id: string; name: string }) => Promise<unknown>;
};

export function EditActionDialog({
  action,
  open,
  onClose,
  onExit,
  onEdit,
}: EditActionDialogProps) {
  const [name, setName] = useState(action.name);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetAmount =
    action.unit === "minutes" ? action.target_amount / 60 : action.target_amount;
  const targetLabel =
    action.unit === "minutes" ? `${targetAmount}시간` : `${targetAmount}회`;

  useEffect(() => {
    if (open) {
      setName(action.name);
      setError("");
    }
  }, [open, action.name]);

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

    setIsSubmitting(true);
    try {
      await onEdit({ id: action.id, name: name.trim() });
      onClose();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "액션을 수정하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-950/35 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content className="fixed inset-x-4 top-4 z-50 max-h-[calc(100svh-32px)] overflow-y-auto rounded-lg border border-stone-200 bg-white p-6 shadow-xl shadow-stone-950/10 outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-32px)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-[20px] font-bold leading-tight text-stone-950">
                액션 수정
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-[15px] leading-6 text-stone-500">
                액션 이름을 수정해보세요.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="닫기">
                <X size={18} aria-hidden />
              </Button>
            </Dialog.Close>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-[14px] font-semibold text-stone-700">
              이름
              <Input
                className="mt-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: 운동, 독서, 공부"
              />
            </label>

            <div>
              <span className="text-[14px] font-semibold text-stone-700">
                주기
              </span>
              <div className="mt-2">
                <SegmentedControl
                  value={action.period}
                  onChange={() => {}}
                  disabled
                  options={[
                    { label: "주간", value: "weekly" },
                    { label: "월간", value: "monthly" },
                  ]}
                />
              </div>
            </div>

            <div>
              <span className="text-[14px] font-semibold text-stone-700">
                단위
              </span>
              <div className="mt-2">
                <SegmentedControl
                  value={action.unit}
                  onChange={() => {}}
                  disabled
                  options={[
                    { label: "횟수", value: "count" },
                    { label: "시간", value: "minutes" },
                  ]}
                />
              </div>
            </div>

            <div>
              <span className="text-[14px] font-semibold text-stone-700">
                목표량 {action.unit === "minutes" ? "(시간)" : "(횟수)"}
              </span>
              <div className="mt-2 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center overflow-hidden rounded-md border border-stone-200 bg-white opacity-50">
                <button
                  type="button"
                  className="flex h-11 items-center justify-center text-stone-700"
                  disabled
                >
                  <Minus size={18} aria-hidden />
                </button>
                <div className="flex h-11 min-w-0 items-center justify-center border-x border-stone-200 px-3 text-[14px] font-bold text-stone-950">
                  {targetLabel}
                </div>
                <button
                  type="button"
                  className="flex h-11 items-center justify-center text-stone-700"
                  disabled
                >
                  <Plus size={18} aria-hidden />
                </button>
              </div>
            </div>

            {error ? <p className="text-sm leading-6 text-red-600">{error}</p> : null}

            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">
                  취소
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
