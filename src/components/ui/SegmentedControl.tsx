import { cn } from "../../lib/utils";

type Option<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="grid grid-cols-2 rounded-md border border-stone-200 bg-stone-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "h-9 rounded-[5px] text-sm font-medium text-stone-600 transition",
            value === option.value && "bg-white text-stone-950 shadow-sm",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
