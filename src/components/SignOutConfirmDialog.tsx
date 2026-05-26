import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "./ui/Button";

type SignOutConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onExit: () => void;
  onConfirm: () => Promise<unknown> | unknown;
};

export function SignOutConfirmDialog({
  open,
  onClose,
  onExit,
  onConfirm,
}: SignOutConfirmDialogProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      const timeout = window.setTimeout(onExit, 160);
      return () => window.clearTimeout(timeout);
    }
  }, [onExit, open]);

  async function handleConfirm() {
    setError("");
    setIsSubmitting(true);

    try {
      await onConfirm();
      onClose();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "로그아웃하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-950/35 data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content className="fixed inset-x-4 top-4 z-50 max-h-[calc(100svh-32px)] overflow-y-auto rounded-lg border border-stone-200 bg-white p-6 shadow-xl shadow-stone-950/10 outline-none sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%-32px)] sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-700">
              <LogOut size={21} aria-hidden />
            </div>
            <div className="min-w-0">
              <Dialog.Title className="text-[19px] font-bold leading-snug text-stone-950">
                로그아웃 할까요?
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-[15px] leading-6 text-stone-600">
                로그인 화면으로 돌아갑니다.
              </Dialog.Description>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm leading-6 text-red-600">{error}</p> : null}

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Dialog.Close asChild>
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                취소
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant="danger"
              disabled={isSubmitting}
              onClick={() => void handleConfirm()}
            >
              {isSubmitting ? "처리 중..." : "로그아웃"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
