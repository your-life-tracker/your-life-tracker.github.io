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
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-stone-200 bg-white p-5 shadow-xl outline-none">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-700">
              <LogOut size={21} aria-hidden />
            </div>
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-stone-950">
                로그아웃할까요?
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-stone-600">
                현재 화면에서 나가고 로그인 화면으로 돌아갑니다.
              </Dialog.Description>
            </div>
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

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
