import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const colors = {
  neutral: "bg-muted text-muted-foreground ring-border",
  pending: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
  active: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/25",
  returned: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25",
};

export function CompactStatusBadge({ caption, label, tone, icon: Icon, className }: {
  caption: string;
  label: string;
  tone: keyof typeof colors;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <span className={cn(
      "inline-flex min-h-7 w-max min-w-28 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs leading-4 font-semibold ring-1 ring-inset",
      colors[tone],
      className,
    )}>
      <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />
      <span className="sr-only">{caption}: </span>
      <span>{label}</span>
    </span>
  );
}
