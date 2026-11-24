import { CircleCheck, EyeOff, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/shared/types/enums";
import { productStatusLabels } from "../filters";

const appearances = {
  ACTIVE: {
    icon: CircleCheck,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25",
  },
  INACTIVE: {
    icon: Pause,
    className: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
  },
  HIDDEN: {
    icon: EyeOff,
    className: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25",
  },
} satisfies Record<ProductStatus, { icon: typeof CircleCheck; className: string }>;

export function ProductStatusBadge({ status, className }: { status: ProductStatus; className?: string }) {
  const { icon: Icon, className: appearanceClassName } = appearances[status];

  return (
    <span className={cn(
      "inline-flex min-h-7 w-max min-w-28 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs leading-4 font-semibold ring-1 ring-inset",
      appearanceClassName,
      className,
    )}>
      <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />
      <span className="sr-only">Trạng thái sản phẩm: </span>
      <span>{productStatusLabels[status]}</span>
    </span>
  );
}
