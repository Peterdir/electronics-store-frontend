import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { OrderStatusBadges } from "@/features/orders/components/OrderStatusBadges";
import { formatDateTime } from "@/lib/format";
import { ApiError } from "@/shared/api/errors";
import { isPositiveLongId } from "@/shared/types/common";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { AdminOrderItems } from "../components/AdminOrderItems";
import { AdminOrderRecipient } from "../components/AdminOrderRecipient";
import { AdminOrderSummary } from "../components/AdminOrderSummary";
import { useAdminOrderDetail } from "../queries";

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const orderId = isPositiveLongId(id) ? id : undefined;
  const query = useAdminOrderDetail(orderId);
  const order = query.data;
  const status = query.error instanceof ApiError ? query.error.status : undefined;
  const unavailable = status === 403 || status === 404;

  return (
    <section className="min-w-0 space-y-6">
      <Link to="/admin/orders" className="inline-block text-sm text-primary underline underline-offset-4">
        Về danh sách đơn hàng
      </Link>
      <AdminPageHeader title="Chi tiết đơn quản trị" />
      {!orderId ? (
        <p role="alert">Mã đơn hàng không hợp lệ.</p>
      ) : unavailable ? (
        <p role="alert">{status === 404 ? "Không tìm thấy đơn hàng." : "Bạn không có quyền xem đơn hàng này."}</p>
      ) : !order ? (
        query.isError ? (
          <div role="alert" className="space-y-3">
            <p>{query.error.message || "Không tải được chi tiết đơn hàng."}</p>
            <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Thử lại</Button>
          </div>
        ) : (
          <p role="status">{query.fetchStatus === "paused" ? "Đang chờ kết nối mạng…" : "Đang tải chi tiết đơn hàng…"}</p>
        )
      ) : (
        <div aria-busy={query.isFetching} className="space-y-6">
          {query.isError && (
            <p role="alert">Không cập nhật được đơn hàng: {query.error.message} Dữ liệu dưới đây có thể chưa mới nhất.</p>
          )}
          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-xl font-semibold wrap-anywhere">Đơn hàng #{order.id}</h2>
              <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
                {query.isFetching ? "Đang cập nhật…" : "Tải lại dữ liệu"}
              </Button>
            </div>
            <OrderStatusBadges orderStatus={order.orderStatus} paymentStatus={order.paymentStatus} />
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Ngày đặt</dt><dd>{formatDateTime(order.createdAt)}</dd></div>
              <div><dt className="text-muted-foreground">Cập nhật lần cuối</dt><dd>{formatDateTime(order.updatedAt)}</dd></div>
              {order.cancelledAt && (
                <div><dt className="text-muted-foreground">Ngày hủy</dt><dd>{formatDateTime(order.cancelledAt)}</dd></div>
              )}
              {order.cancelReason && (
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Lý do hủy</dt><dd className="whitespace-pre-wrap wrap-anywhere">{order.cancelReason}</dd></div>
              )}
            </dl>
          </section>
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 space-y-6">
              <AdminOrderRecipient order={order} />
              <AdminOrderItems items={order.items} />
            </div>
            <AdminOrderSummary order={order} />
          </div>
        </div>
      )}
    </section>
  );
}
