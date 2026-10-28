import { formatVND } from "@/lib/format";


export function CartSummary({
  totalItems,
  totalPrice,
  hasIssues,
  disabled,
  onClear,
}: {
  totalItems: number;
  totalPrice: number;
  hasIssues: boolean;
  disabled: boolean;
  onClear: () => void;
}) {
  return (
    <aside className="space-y-3 rounded-md border p-4">
      <h2 className="text-lg font-semibold">Tóm tắt giỏ hàng</h2>
      <p>Tổng số lượng: {totalItems}</p>
      <p>Tạm tính: {formatVND(totalPrice)}</p>

      {hasIssues && (
        <p role="alert" className="text-sm text-destructive">
          Hãy xử lý sản phẩm hết hoặc thiếu hàng trước khi thanh toán.
        </p>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={onClear}
        className="text-destructive underline disabled:opacity-40"
      >
        Xóa tất cả
      </button>
    </aside>
  );
}