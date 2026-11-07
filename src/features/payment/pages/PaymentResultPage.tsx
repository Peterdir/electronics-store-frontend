import { useLocation } from "react-router";
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
    />
  );
}