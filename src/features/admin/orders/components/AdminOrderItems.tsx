import { formatVND } from "@/lib/format";
import type { AdminOrderItemResponse } from "../types";

export function AdminOrderItems({ items }: { items: AdminOrderItemResponse[] }) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Sản phẩm trong đơn</h2>
      <p className="mt-1 text-sm text-muted-foreground">Tên, ảnh và giá được lưu tại thời điểm đặt hàng.</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Đơn hàng không có dòng sản phẩm.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.productName}
                  loading="lazy"
                  className="size-16 shrink-0 rounded-lg border border-border object-contain sm:size-20"
                />
              ) : (
                <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-center text-xs text-muted-foreground sm:size-20">
                  Không có ảnh
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium wrap-anywhere">{item.productName}</p>
                <p className="text-sm text-muted-foreground wrap-anywhere">SKU: {item.variantSku || "—"}</p>
                {item.variantId === null && (
                  <p className="text-sm text-muted-foreground">Biến thể hiện không còn được liên kết.</p>
                )}
                <dl className="grid gap-2 pt-2 text-sm sm:grid-cols-3">
                  <div><dt className="text-muted-foreground">Đơn giá</dt><dd>{formatVND(item.unitPrice)}</dd></div>
                  <div><dt className="text-muted-foreground">Số lượng</dt><dd>{item.quantity}</dd></div>
                  <div><dt className="text-muted-foreground">Thành tiền</dt><dd className="font-semibold tabular-nums">{formatVND(item.subtotal)}</dd></div>
                </dl>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
