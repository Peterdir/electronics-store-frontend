import type { CartRow } from "../cartView.types";

export function CartIssueBanner({ row }: { row: CartRow }) {
  if (!row.issue) return null;

  return (
    <p role="alert" className="text-sm text-destructive">
      {row.stock === 0
        ? "Sản phẩm đã hết hàng. Hãy xóa khỏi giỏ."
        : `Chỉ còn ${row.stock} sản phẩm. Hãy giảm số lượng.`}
    </p>
  );
}