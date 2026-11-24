import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown } from "lucide-react";
import { ProductStatus } from "@/shared/types/enums";
import { ProductStatusBadge } from "./ProductStatusBadge";
import { productStatusLabels } from "../filters";

export function ProductStatusAction({ status, disabled, onSelect }: {
  status: ProductStatus;
  disabled: boolean;
  onSelect: (status: ProductStatus) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <Popover.Root open={editing} onOpenChange={(open) => {
      if (open && disabled) return;
      setEditing(open);
    }}>
      <Popover.Trigger
        type="button"
        className="group relative inline-flex shrink-0 cursor-pointer rounded-lg outline-none transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:pointer-events-none disabled:opacity-50"
        aria-label={`Đổi trạng thái sản phẩm: ${productStatusLabels[status]}`}
        disabled={disabled}
      >
        <ProductStatusBadge status={status} className="h-9 rounded-lg py-0 pr-8 pl-3 text-sm transition-[filter] group-hover:brightness-95" />
        <ChevronDown aria-hidden="true" className={`pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground transition-transform ${editing ? "rotate-180" : ""}`} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={8} className="z-50">
          <Popover.Popup
            className="w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg outline-none"
          >
            <Popover.Title className="px-2.5 py-2 text-xs font-semibold text-muted-foreground">Trạng thái sản phẩm</Popover.Title>
            {Object.values(ProductStatus).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={value === status}
                disabled={disabled}
                className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 text-left text-sm font-medium outline-none hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-pressed:bg-primary/10 aria-pressed:text-primary"
                onClick={() => {
                  setEditing(false);
                  if (!disabled && value !== status) onSelect(value);
                }}
              >
                {productStatusLabels[value]}
                {value === status && <Check aria-hidden="true" className="size-4" />}
              </button>
            ))}
            <p className="mt-1 border-t border-border px-2.5 pt-2 pb-1 text-xs text-muted-foreground">Trạng thái bán của từng biến thể được giữ nguyên.</p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
