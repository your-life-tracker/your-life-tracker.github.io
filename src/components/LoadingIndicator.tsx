import progressLoader from "../assets/progress-loader.gif";
import { cn } from "../lib/utils";

type LoadingIndicatorProps = {
  className?: string;
};

export function LoadingIndicator({ className }: LoadingIndicatorProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <img
        className="h-auto w-44 opacity-90"
        src={progressLoader}
        alt="불러오는 중"
      />
    </div>
  );
}
