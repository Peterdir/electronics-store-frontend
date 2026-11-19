import type { OrderDetailAdminResponse } from "../types";

type RecipientInfo = Pick<OrderDetailAdminResponse,
  "userId" | "customerName" | "customerEmail" | "recipientName" | "recipientPhone" | "shippingAddress"
>;

export function AdminOrderRecipient({ order }: { order: RecipientInfo }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Khách hàng và người nhận</h2>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Loại khách hàng</dt>
          <dd className="mt-1 wrap-anywhere">
            {order.userId === null ? "Khách vãng lai (guest)" : `Khách có tài khoản · ID ${order.userId}`}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Tên tài khoản</dt>
          <dd className="mt-1 wrap-anywhere">{order.customerName || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email tài khoản</dt>
          <dd className="mt-1 wrap-anywhere">{order.customerEmail || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Người nhận</dt>
          <dd className="mt-1 wrap-anywhere">{order.recipientName || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Điện thoại người nhận</dt>
          <dd className="mt-1 wrap-anywhere">{order.recipientPhone || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Địa chỉ giao hàng</dt>
          <dd className="mt-1 whitespace-pre-wrap wrap-anywhere">{order.shippingAddress || "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
