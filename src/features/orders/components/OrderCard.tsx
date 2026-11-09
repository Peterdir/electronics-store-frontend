import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatDateTime, formatVND } from "@/lib/format";
import {
  orderStatusLabels,
  paymentStatusLabels,
} from "../orderStatus";
import type { OrderListUserResponse } from "../types";

interface OrderCardProps {
  order: OrderListUserResponse;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <article className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words font-semibold">
            Đơn hàng #{order.id}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Ngày đặt: {formatDateTime(order.orderDate)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={`Đơn hàng: ${orderStatusLabels[order.orderStatus]}`}
          />

          <StatusBadge
            label={`Thanh toán: ${paymentStatusLabels[order.paymentStatus]}`}
          />
        </div>
      </header>

      <ul className="divide-y divide-border">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-4 py-3"
          >
            <div className="min-w-0">
              <p className="break-words font-medium">
                {item.productName}
              </p>

              <p className="text-sm text-muted-foreground">
                SKU: {item.variantSku || "Không có"}
                {" · "}Số lượng: {item.quantity}
              </p>
            </div>

            <p className="shrink-0 text-sm">
              {formatVND(item.subtotal)}
            </p>
          </li>
        ))}
      </ul>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          {order.totalItems} sản phẩm
          {" · "}
          {order.paymentMethod === "COD"
            ? "Thanh toán khi nhận hàng"
            : "VNPay"}
        </p>

        <p className="font-semibold">
          Tổng tiền: {formatVND(order.totalPrice)}
        </p>
      </footer>
    </article>
  );
}
