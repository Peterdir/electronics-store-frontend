import { Clock } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useOrderDetail } from "@/features/orders/queries";
import { formatDateTime } from "@/lib/format";
import { ApiError } from "@/shared/api/errors";
import { useSession } from "@/shared/auth/session.store";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { isPositiveLongId, type ID } from "@/shared/types/common";
import { ReturnRequestForm } from "../components/ReturnRequestForm";
import { getReturnEligibility } from "../eligibility";
import { useCreateReturnRequest } from "../queries";
import type { ReturnRequestResponse } from "../types";

const ordersPath = "/account/orders";

function ReturnReceipt({ request }: { request: ReturnRequestResponse }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 role="status" className="text-lg font-semibold">Đã gửi yêu cầu trả hàng</h2>
      <StatusBadge caption="Trạng thái yêu cầu" label="Chờ xử lý" tone="pending" icon={Clock} />
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Mã yêu cầu</dt>
          <dd className="font-semibold wrap-anywhere">#{request.id}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ngày gửi</dt>
          <dd>{formatDateTime(request.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Số lượng trả</dt>
          <dd>{request.quantity}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ảnh đã gửi</dt>
          <dd>{request.imageUrls.length}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Lý do trả hàng</dt>
          <dd className="wrap-anywhere">{request.reason}</dd>
        </div>
        {request.description && (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Mô tả</dt>
            <dd className="whitespace-pre-wrap wrap-anywhere">{request.description}</dd>
          </div>
        )}
      </dl>
      <p className="text-sm text-muted-foreground">
        Hãy lưu mã yêu cầu để liên hệ cửa hàng khi cần kiểm tra tiến độ.
      </p>
    </section>
  );
}

function ReturnRequestContent({ orderId, orderItemId }: { orderId: ID; orderItemId: ID }) {
  const orderQuery = useOrderDetail(orderId, true);
  const { receipt, error, sending, submit } = useCreateReturnRequest(orderId, orderItemId);
  const orderError = orderQuery.error instanceof ApiError ? orderQuery.error : undefined;

  if (receipt) return <ReturnReceipt request={receipt} />;
  if (error?.status === 409) {
    return <p role="alert">Sản phẩm này đã có yêu cầu trả hàng. Hãy liên hệ cửa hàng với mã đơn để kiểm tra.</p>;
  }
  if (error?.status === 403 || orderError?.status === 403 ||
      (orderError?.status === 400 && orderError.message === "You do not have permission to view this order.")) {
    return <p role="alert">Bạn không có quyền yêu cầu trả hàng cho sản phẩm này.</p>;
  }
  if (error?.status === 404 || orderError?.status === 404) {
    return <p role="alert">Không tìm thấy đơn hàng hoặc sản phẩm cần trả.</p>;
  }

  const retry = orderQuery.isError && (
    <div className="space-y-2" role="alert">
      <p>Không tải được chi tiết đơn hàng.</p>
      <Button variant="outline" disabled={orderQuery.isFetching} onClick={() => void orderQuery.refetch()}>
        Tải lại chi tiết đơn
      </Button>
    </div>
  );
  const order = orderQuery.data;
  if (!order) {
    return retry || (
      <p role="status">
        {orderQuery.fetchStatus === "paused" ? "Đang chờ kết nối mạng…" : "Đang tải chi tiết đơn hàng…"}
      </p>
    );
  }
  const item = order.items.find((item) => item.id === orderItemId);
  if (order.id !== orderId || !item) {
    return <p role="alert">Không tìm thấy sản phẩm trong đơn hàng này. Hãy quay lại chi tiết đơn để chọn lại.</p>;
  }
  if (item.returnStatus) {
    return <p role="status">Sản phẩm này đã có yêu cầu trả hàng. Hãy xem trạng thái tại chi tiết đơn hàng.</p>;
  }
  const eligibility = getReturnEligibility(order);
  if (eligibility.error) return retry || <p role="alert">{eligibility.error}</p>;

  const checking = !orderQuery.isFetchedAfterMount || !orderQuery.isSuccess || orderQuery.fetchStatus !== "idle";
  return (
    <>
      <section className="space-y-1 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-semibold wrap-anywhere">{item.productName}</h2>
        <p className="text-sm text-muted-foreground wrap-anywhere">Đơn #{orderId} · SKU {item.variantSku || "—"}</p>
        <p className="text-sm text-muted-foreground">
          Hạn gửi yêu cầu {formatDateTime(new Date(eligibility.deadline).toISOString())}.
        </p>
      </section>
      {retry || (checking && (
        <p role="status">
          {orderQuery.fetchStatus === "paused" ? "Đang chờ kết nối mạng…" : "Đang kiểm tra đơn hàng…"}
        </p>
      ))}
      <ReturnRequestForm purchasedQuantity={item.quantity} checking={checking} sending={sending} submit={submit} />
    </>
  );
}

export function ReturnRequestPage() {
  const [params] = useSearchParams();
  const userId = useSession((state) => state.user?.id);
  const orderId = params.get("orderId") ?? undefined;
  const orderItemId = params.get("orderItemId") ?? undefined;
  const validSelection = isPositiveLongId(orderId) && isPositiveLongId(orderItemId);

  return (
    <section className="min-w-0 max-w-3xl space-y-4">
      <title>Yêu cầu trả hàng</title>
      <Link
        to={validSelection ? `${ordersPath}/${orderId}` : ordersPath}
        className="inline-block text-sm text-primary underline"
      >
        {validSelection ? "Về chi tiết đơn hàng" : "Về danh sách đơn hàng"}
      </Link>
      <h1 className="text-2xl font-bold">Yêu cầu trả hàng</h1>
      {!validSelection ? (
        <p role="alert">Hãy chọn sản phẩm muốn trả từ chi tiết đơn hàng.</p>
      ) : !userId ? (
        <p role="alert">Vui lòng đăng nhập lại để gửi yêu cầu.</p>
      ) : (
        <ReturnRequestContent key={`${userId}:${orderId}:${orderItemId}`} orderId={orderId} orderItemId={orderItemId} />
      )}
    </section>
  );
}
