import { Link } from "react-router";
import { formatDateTime, formatVND } from "@/lib/format";
import { orderStatusTones } from "../orderStatus";
import type { OrderListUserResponse } from "../types";
import { OrderStatusBadges } from "./OrderStatusBadges";

interface OrderCardProps {
  order: OrderListUserResponse;
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <article
      className="order-card relative space-y-4 rounded-2xl border border-border bg-card p-5"
      data-order-tone={orderStatusTones[order.orderStatus] ?? "neutral"}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words font-semibold">
            Đơn hàng #{order.id}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Ngày đặt: {formatDateTime(order.orderDate)}
          </p>
        </div>

        <OrderStatusBadges
          orderStatus={order.orderStatus}
          paymentStatus={order.paymentStatus}
        />
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

      <Link
        to={`/account/orders/${order.id}`}
        className="text-sm font-medium text-primary underline underline-offset-4"
      >
        Xem chi tiết
      </Link>

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
