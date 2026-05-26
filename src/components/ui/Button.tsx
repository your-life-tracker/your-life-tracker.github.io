import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({
  asChild,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium transition disabled:pointer-events-none disabled:opacity-45",
        "focus-visible:outline-none focus-visible:ring-0",
        variant === "primary" &&
          "bg-stone-950 text-white hover:bg-stone-800",
        variant === "secondary" &&
          "border border-stone-200 bg-white text-stone-950 hover:bg-stone-100",
        variant === "ghost" && "text-stone-600 hover:bg-stone-100",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "icon" && "h-10 w-10",
        className,
      )}
      {...props}
    />
  );
}
