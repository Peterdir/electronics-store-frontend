import { Link } from "react-router";

type ResultKind =
  | "pending"
  | "success"
  | "cancelled"
  | "failed"
  | "unknown";

interface Props {
  kind: ResultKind;
  message: string;
  orderId?: string;
}

const titles: Record<ResultKind, string> = {
  pending: "Đang xác nhận thanh toán",
  success: "Thanh toán thành công",
  cancelled: "Bạn đã hủy thanh toán",
  failed: "Thanh toán không thành công",
  unknown: "Chưa xác định được kết quả thanh toán",
};

export function PaymentResultView({
  kind,
  message,
  orderId,
}: Props) {
  return (
    <section
      className="mx-auto max-w-2xl space-y-5 rounded-2xl border p-5 sm:p-8"
      aria-busy={kind === "pending"}
    >
      <h1 className="text-2xl font-bold">{titles[kind]}</h1>

      <div role="status" className="space-y-3">
        <p>{message}</p>

        {orderId && (
          <p>
            Mã đơn: <strong className="break-all">{orderId}</strong>
          </p>
        )}

        {(kind === "cancelled" || kind === "failed") && (
          <p className="text-sm text-muted-foreground">
            Đơn hàng đã được tạo. Hủy hoặc thất bại thanh toán
            không đồng nghĩa đơn hàng đã bị hủy.
          </p>
        )}
      </div>

      {kind !== "pending" && (
        <Link className="text-primary underline" to="/products">
          Tiếp tục mua sắm
        </Link>
      )}
    </section>
  );
}