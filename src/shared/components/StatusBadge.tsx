import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  neutral: "border-border bg-muted text-foreground",
  pending: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-200",
  active: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/30 dark:bg-sky-400/15 dark:text-sky-200",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/15 dark:text-emerald-200",
  danger: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/30 dark:bg-rose-400/15 dark:text-rose-200",
  returned: "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-400/30 dark:bg-violet-400/15 dark:text-violet-200",
};

export type StatusTone = keyof typeof statusColors;
export type StatusEffect = "pulse" | "lift" | "glide" | "confirm" | "stop" | "rotate";

interface StatusBadgeProps {
  caption: string;
  label: string;
  tone: StatusTone;
  icon: LucideIcon;
  effect?: StatusEffect;
  prominent?: boolean;
}

export function StatusBadge({
  caption,
  label,
  tone,
  icon: Icon,
  effect,
  prominent = false,
}: StatusBadgeProps) {
  const inProgress = tone === "active" || tone === "pending";

  return (
    <div
      className={cn(
        "status-badge min-w-0 max-w-full border",
        prominent
          ? "status-badge-prominent rounded-2xl p-4 sm:p-5 motion-safe:transition-colors motion-safe:duration-200"
          : "rounded-xl px-2.5 py-1.5",
        statusColors[tone],
      )}
      data-effect={effect}
      aria-live={prominent ? "polite" : undefined}
      aria-atomic={prominent ? true : undefined}
    >
      <div
        key={label}
        className={cn(
          "flex min-w-0 items-center",
          prominent ? "status-badge-content gap-3 sm:gap-4" : "gap-2",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "status-badge-icon grid shrink-0 place-items-center",
            prominent ? "size-11 rounded-xl" : "size-7 rounded-lg",
          )}
        >
          <Icon className={prominent ? "size-5" : "size-4"} />
        </span>
        <div className="min-w-0 flex-1 wrap-anywhere">
          <p className="text-xs font-medium">{caption}</p>
          <p className={cn("font-semibold", prominent ? "text-lg tracking-tight" : "text-sm")}>
            {label}
          </p>
        </div>
        {inProgress && (
          <span
            aria-hidden="true"
            className={cn(
              "status-badge-indicator shrink-0 rounded-full bg-current",
              prominent ? "ml-1 size-2" : "ml-0.5 size-1.5",
            )}
          />
        )}
      </div>
    </div>
  );
}
