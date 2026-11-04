import { formatVND } from "@/lib/format";

interface Props {
  subtotal: number;
  shippingFee: number;
}

export function OrderSummaryPanel({
  subtotal,
  shippingFee,
}: Props) {
  const estimatedTotal = subtotal + shippingFee;

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-lg font-semibold">
        Tổng tiền tạm tính
      </h2>

      <dl className="space-y-3 tabular-nums">
        <div className="flex justify-between gap-4">
          <dt>Tiền hàng</dt>
          <dd>{formatVND(subtotal)}</dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt>Phí giao hàng</dt>
          <dd>{formatVND(shippingFee)}</dd>
        </div>

        <div className="flex justify-between gap-4 border-t border-border pt-3 font-semibold">
          <dt>Tổng tạm tính</dt>
          <dd className="text-primary" aria-live="polite">
            {formatVND(estimatedTotal)}
          </dd>
        </div>
      </dl>

      <p className="text-sm text-muted-foreground">
        Giá, tồn kho và mã giảm giá sẽ được backend kiểm tra
        khi đặt hàng. Số tiền xác nhận lấy từ kết quả tạo đơn.
      </p>
    </section>
  );
}