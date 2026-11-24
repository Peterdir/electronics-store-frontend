import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminProductVariantResponse } from "../types";

export function ReactivateVariantAction({ variant, disabled, onSelect }: {
  variant: AdminProductVariantResponse;
  disabled: boolean;
  onSelect: () => void;
}) {
  return <Button type="button" variant="outline" size="lg" className="gap-2 border-primary/25 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary" disabled={disabled || variant.status === "ACTIVE"} aria-label={`Bán lại biến thể ${variant.sku}`} onClick={onSelect}>
    <RotateCcw aria-hidden="true" className="size-4" />
    Bán lại
  </Button>;
}
