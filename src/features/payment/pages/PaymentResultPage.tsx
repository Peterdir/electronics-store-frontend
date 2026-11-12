import { useLocation } from "react-router";
import { useOrderAfterPayment } from "@/features/orders/queries";
import { isPositiveLongId } from "@/shared/types/common";
import { useVnpayReturn } from "../queries";
import { PaymentResultView } from "../components/PaymentResultView";

export function PaymentResultPage() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const validSearch = Boolean(
    params.get("vnp_TxnRef") &&
    params.get("vnp_SecureHash"),
  );

  const query = useVnpayReturn(search, validSearch);
  const resultOrderId = validSearch ? query.data?.orderId : undefined;
  const orderQuery = useOrderAfterPayment(
    isPositiveLongId(resultOrderId) ? resultOrderId : undefined,
  );
  const viewableOrderId =
    orderQuery.isSuccess && orderQuery.isFetchedAfterMount && !orderQuery.isFetching
      ? orderQuery.data
      : undefined;

  if (!validSearch) {
    return (
      <PaymentResultView
        kind="unknown"
        message="Liên kết thiếu thông tin xác nhận. Chưa thể kết luận kết quả thanh toán."
      />
    );
  }

  if (query.isError) {
    return (
      <PaymentResultView
        kind="unknown"
        message="Không lấy được xác nhận từ máy chủ. Thanh toán có thể đã được xử lý; hãy giữ thông tin giao dịch để đối chiếu với cửa hàng."
      />
    );
  }

  if (query.isPending) {
    return (
      <PaymentResultView
        kind="pending"
        message="Vui lòng chờ máy chủ kiểm tra giao dịch."
      />
    );
  }

  const result = query.data;

  if (result.success) {
    return (
      <PaymentResultView
        kind="success"
        message={result.message}
        orderId={result.orderId}
        viewableOrderId={viewableOrderId}
      />
    );
  }

  if (!result.orderId) {
    return (
      <PaymentResultView
        kind="unknown"
        message={result.message}
      />
    );
  }

  const cancelled = params.get("vnp_ResponseCode") === "24";

  return (
    <PaymentResultView
      kind={cancelled ? "cancelled" : "failed"}
      message={result.message}
      orderId={result.orderId}
      viewableOrderId={viewableOrderId}
    />
  );
}
