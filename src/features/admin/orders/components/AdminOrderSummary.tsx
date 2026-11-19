import { formatVND } from "@/lib/format";
import type { OrderDetailAdminResponse } from "../types";

type SummaryInfo = Pick<OrderDetailAdminResponse,
  "subtotal" | "shippingFee" | "couponCode" | "discountAmount" | "totalPrice" | "paymentMethod"
>;

const paymentMethodLabels = { COD: "Thanh toán khi nhận hàng (COD)", VNPAY: "VNPay" };

export function AdminOrderSummary({ order }: { order: SummaryInfo }) {
  return (
    <section className="self-start rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Tổng tiền</h2>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <dt>
            Tạm tính
          </dt>
          <dd className="tabular-nums">
            {formatVND(order.subtotal)}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt>
            Phí giao hàng
          </dt>
          <dd className="tabular-nums">
            {formatVND(order.shippingFee)}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt>Giảm giá</dt><dd className="tabular-nums">{formatVND(order.discountAmount)}</dd></div>
        <div>
          <dt className="text-muted-foreground">
            Mã giảm giá
          </dt>
          <dd className="mt-1 wrap-anywhere">
            {order.couponCode || "Không sử dụng"}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3 text-base font-semibold">
          <dt>
            Tổng thanh toán
          </dt>
          <dd className="tabular-nums">
            {formatVND(order.totalPrice)}
          </dd>
        </div>
        <div className="border-t border-border pt-3">
          <dt className="text-muted-foreground">
            Phương thức thanh toán
          </dt>
          <dd className="mt-1">
            {paymentMethodLabels[order.paymentMethod] ?? "Chưa rõ"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
