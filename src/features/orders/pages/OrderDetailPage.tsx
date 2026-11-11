import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatVND } from "@/lib/format";
import { ApiError } from "@/shared/api/errors";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { isPositiveLongId } from "@/shared/types/common";
import { OrderItems } from "../components/OrderItems";
import { orderStatusLabels, paymentStatusLabels } from "../orderStatus";
import { useOrderDetail } from "../queries";
import type { OrderDetailUserResponse } from "../types";

const ordersPath = "/account/orders";

function OrderDetailContent({ order }: { order: OrderDetailUserResponse }) {
  return (
    <>
      <header className="space-y-3">
        <h1 className="text-2xl font-bold wrap-anywhere">
          Đơn hàng #{order.id}
        </h1>

        <div className="flex flex-wrap gap-2">
          <StatusBadge label={orderStatusLabels[order.orderStatus]} />
          <StatusBadge label={paymentStatusLabels[order.paymentStatus]} />
        </div>

        <dl className="space-y-1 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-x-2">
            <dt>Ngày đặt</dt>
            <dd>{formatDateTime(order.createdAt)}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt>Cập nhật lần cuối</dt>
            <dd>{formatDateTime(order.updatedAt)}</dd>
          </div>
          {order.cancelledAt && (
            <div className="flex flex-wrap gap-x-2">
              <dt>Ngày hủy</dt>
              <dd>{formatDateTime(order.cancelledAt)}</dd>
            </div>
          )}
          {order.cancelReason && (
            <div className="space-y-1">
              <dt>Lý do hủy</dt>
              <dd className="wrap-anywhere">{order.cancelReason}</dd>
            </div>
          )}
        </dl>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <OrderItems items={order.items} />

        <div className="min-w-0 space-y-4">
          <section className="space-y-1 rounded-2xl border border-border bg-card p-4 wrap-anywhere">
            <h2 className="mb-2 font-semibold">Thông tin nhận hàng</h2>
            <p>{order.recipientName}</p>
            <p>{order.recipientPhone}</p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress}
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="font-semibold">Thanh toán</h2>
            <p className="text-sm text-muted-foreground">
              {order.paymentMethod === "COD"
                ? "Thanh toán khi nhận hàng"
                : "VNPay"}
            </p>

            <dl className="space-y-2 text-sm tabular-nums">
              <div className="flex justify-between gap-3">
                <dt>Tiền hàng</dt>
                <dd>{formatVND(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Phí giao hàng</dt>
                <dd>{formatVND(order.shippingFee)}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-3">
                <dt className="wrap-anywhere">
                  Giảm giá{order.couponCode ? ` (${order.couponCode})` : ""}
                </dt>
                <dd>
                  {order.discountAmount > 0 ? "−" : ""}
                  {formatVND(order.discountAmount)}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-3 border-t border-border pt-2 font-semibold">
                <dt>Tổng thanh toán</dt>
                <dd>{formatVND(order.totalPrice)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const orderId = isPositiveLongId(id) ? id : undefined;
  const orderQuery = useOrderDetail(orderId);

  const apiError = orderQuery.error instanceof ApiError ? orderQuery.error : null;
  const notFound = apiError?.status === 404;
  const forbidden =
    apiError?.status === 403 ||
    (apiError?.status === 400 &&
      apiError.message === "You do not have permission to view this order.");

  return (
    <section className="min-w-0 space-y-5">
      <Link to={ordersPath} className="inline-block text-sm text-primary underline">
        Về danh sách đơn hàng
      </Link>

      {!orderId ? (
        <p role="alert">Mã đơn hàng không hợp lệ.</p>
      ) : notFound || forbidden ? (
        <p role="alert">
          {notFound
            ? "Không tìm thấy đơn hàng."
            : "Bạn không có quyền xem đơn hàng này."}
        </p>
      ) : orderQuery.isError ? (
        <div role="alert" className="space-y-3">
          <p>{apiError?.message ?? "Không tải được chi tiết đơn hàng."}</p>
          <Button
            type="button"
            variant="outline"
            disabled={orderQuery.isFetching}
            onClick={() => void orderQuery.refetch()}
          >
            Thử lại
          </Button>
        </div>
      ) : orderQuery.isPending ? (
        <p role="status">
          {orderQuery.fetchStatus === "paused"
            ? "Đang chờ kết nối mạng…"
            : "Đang tải chi tiết đơn hàng…"}
        </p>
      ) : (
        <OrderDetailContent order={orderQuery.data} />
      )}
    </section>
  );
}