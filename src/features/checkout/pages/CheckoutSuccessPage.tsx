import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/api/queryKeys";
import { useSession } from "@/shared/auth/session.store";
import { isExpired } from "@/shared/auth/jwt";
import { PaymentMethod, type PaymentStatus } from "@/shared/types/enums";
import { formatVND } from "@/lib/format";
import { parseConfirmation, readConfirmation } from "../confirmation.storage";

const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  PENDING_REFUND: "Đang chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
};

export function CheckoutSuccessPage() {
  const { orderId = "" } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();

  const token = useSession((state) => state.token);
  const userId = useSession((state) => state.user?.id) ?? null;
  const validSession = userId === null ? !token : Boolean(token && !isExpired(token));

  const state: unknown = location.state;
  const navigation = typeof state === "object" && state !== null
    ? state as Record<string, unknown>
    : null;

  const confirmation = validSession
    ? parseConfirmation(navigation?.confirmation, orderId, userId) ?? readConfirmation(orderId, userId)
    : null;
  const confirmedOrderId = confirmation?.order.orderId;

  useEffect(() => {
    if (
      !confirmedOrderId || 
      !userId || 
      !token || 
      isExpired(token)
    ) return;
    
    void queryClient.refetchQueries({ queryKey: [...qk.cart, userId], exact: true, type: "active" });
  }, [confirmedOrderId, userId, token, queryClient]);

  if (!confirmation) {
    return (
      <section className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Thông tin xác nhận đơn hàng</h1>
        <p role="status">Không có thông tin xác nhận phù hợp với đơn hàng và phiên hiện tại. Điều này không có nghĩa đơn đã thất bại.</p>
        <Link className="text-primary underline" to="/products">Tiếp tục mua sắm</Link>
      </section>
    );
  }

  const { order } = confirmation;
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Đặt hàng thành công</h1>
        <p>Mã đơn: <strong className="break-all">{order.orderId}</strong></p>
        <p>{order.paymentMethod === PaymentMethod.COD ? "Thanh toán khi nhận hàng (COD)" : "Thanh toán VNPay"} · {paymentStatusLabels[order.paymentStatus]}</p>
        {order.paymentMethod === PaymentMethod.VNPAY && (
          <p className="text-sm text-muted-foreground">
            Trạng thái trên được ghi nhận lúc tạo đơn.
            Kết quả thanh toán được xác nhận riêng khi quay về từ VNPay.
          </p>
        )}
        <p className="text-sm text-muted-foreground">Đặt lúc {new Date(order.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</p>
      </div>

      <section className="space-y-2 rounded-2xl border p-5 wrap-anywhere">
        <h2 className="text-lg font-semibold">Thông tin nhận hàng</h2>
        <p>{order.recipientName} · {order.recipientPhone}</p>
        <p>{order.shippingAddress}</p>
      </section>

      <section className="space-y-4 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Sản phẩm đã đặt</h2>
        <ul className="divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex flex-wrap justify-between gap-2 py-3">
              <div className="min-w-0 flex-1 wrap-anywhere">
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-muted-foreground">{item.variantSku} · {item.quantity} × {formatVND(item.unitPrice)}</p>
              </div>
              <p className="tabular-nums">{formatVND(item.subtotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t pt-4 tabular-nums">
          <div className="flex justify-between gap-3"><dt>Tiền hàng</dt><dd>{formatVND(order.subtotal)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Phí giao hàng</dt><dd>{formatVND(order.shippingFee)}</dd></div>
          <div className="flex flex-wrap justify-between gap-3"><dt className="wrap-anywhere">Giảm giá{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>−{formatVND(order.discountAmount)}</dd></div>
          <div className="flex justify-between gap-3 text-lg font-bold"><dt>Tổng thanh toán</dt><dd>{formatVND(order.totalPrice)}</dd></div>
        </dl>
      </section>

      {navigation?.stored === false && <p role="status" className="text-sm">Đơn đã tạo thành công. Trình duyệt chưa lưu được bản xác nhận để xem lại.</p>}
      {navigation?.cartSyncFailed === true && <p role="status" className="text-sm">Đơn đã tạo thành công. Giỏ hàng chưa đồng bộ xong; hãy kiểm tra lại giỏ trước lần mua tiếp theo.</p>}
      <Link className="text-primary underline" to="/products">Tiếp tục mua sắm</Link>
    </section>
  );
}
