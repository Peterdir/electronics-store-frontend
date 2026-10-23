import type { VariantResponse } from "../types";

interface StockIndicatorProps {
  variant: VariantResponse | undefined;
}

export function StockIndicator({ variant }: StockIndicatorProps) {
  if (!variant || variant.stock <= 0) {
    return <p role="status" className="text-destructive">Hết hàng</p>;
  }

  return <p role="status">Còn {variant.stock} sản phẩm</p>;
}