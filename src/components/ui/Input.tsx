import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-stone-200 bg-white px-3.5 text-base leading-none text-stone-950 outline-none transition-colors sm:text-sm",
        "placeholder:text-stone-400 focus:border-emerald-300 focus:shadow-[0_0_0_1px_rgb(110_231_183_/_0.28)]",
        className,
      )}
      {...props}
    />
  );
}
