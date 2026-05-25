import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none",
        "placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10",
        className,
      )}
      {...props}
    />
  );
}
