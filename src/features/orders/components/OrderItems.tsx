import { useState } from "react";
import { formatVND } from "@/lib/format";
import type { OrderItemResponse } from "../types";

function ItemThumbnail({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <span
        aria-hidden="true"
        className="grid size-14 shrink-0 place-items-center rounded-lg bg-muted text-xs text-muted-foreground"
      >
        Ảnh
      </span>
    );
  }

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-14 shrink-0 rounded-lg bg-muted object-contain"
    />
  );
}

export function OrderItems({ items }: { items: OrderItemResponse[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h2 className="font-semibold">Sản phẩm đã đặt</h2>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Đơn hàng chưa có thông tin sản phẩm.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-4 last:pb-0">
              <ItemThumbnail key={item.thumbnailUrl} url={item.thumbnailUrl} />

              <div className="min-w-0 flex-1">
                <p className="font-medium wrap-anywhere">{item.productName}</p>
                <p className="text-sm text-muted-foreground wrap-anywhere">
                  SKU {item.variantSku || "—"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.quantity} × {formatVND(item.unitPrice)}
                </p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatVND(item.subtotal)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}