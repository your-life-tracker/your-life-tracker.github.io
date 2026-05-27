import { cn } from "../../lib/utils";

type Option<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn("grid grid-cols-2 rounded-md border border-stone-200 bg-stone-100 p-1", disabled && "opacity-50")}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "h-9 rounded-[5px] text-[14px] font-semibold leading-none text-stone-600 transition",
            value === option.value && "bg-white text-stone-950 shadow-sm",
          )}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
