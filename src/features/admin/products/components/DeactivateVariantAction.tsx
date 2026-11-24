import { Button } from "@/components/ui/button";
import { Pause } from "lucide-react";
import type { AdminProductVariantResponse } from "../types";

export function DeactivateVariantAction({ variant, disabled, onSelect }: {
  variant: AdminProductVariantResponse;
  disabled: boolean;
  onSelect: () => void;
}) {
  return <Button type="button" variant="outline" size="lg" className="gap-2 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive" disabled={disabled || variant.status === "INACTIVE"} aria-label={`Ngừng bán biến thể ${variant.sku}`} onClick={onSelect}>
    <Pause aria-hidden="true" className="size-4" />
    Ngừng bán
  </Button>;
}
