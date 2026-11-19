import { useState } from "react";
import { Link } from "react-router";
import { formatVND } from "@/lib/format";
import type { ID } from "@/shared/types/common";
import type { ReturnStatus } from "@/shared/types/enums";
import type { OrderItemResponse } from "../types";

const returnStatusLabels: Record<ReturnStatus, string> = {
  PENDING: "Yêu cầu trả hàng đang chờ xử lý",
  APPROVED: "Yêu cầu trả hàng đã được chấp nhận",
  REJECTED: "Yêu cầu trả hàng đã bị từ chối",
};

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

export function OrderItems({ items, reviewableItemIds, returnOrderId }: {
  items: OrderItemResponse[];
  reviewableItemIds?: ReadonlySet<ID>;
  returnOrderId?: ID;
}) {
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
            <li key={item.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-4 py-4 last:pb-0">
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
                {item.returnStatus && (
                  <p className="mt-2 text-sm text-muted-foreground">{returnStatusLabels[item.returnStatus]}</p>
                )}
              </div>
              {(reviewableItemIds?.has(item.id) || (returnOrderId && !item.returnStatus)) && (
                <div className="col-span-2 flex flex-col gap-2 sm:col-span-1 sm:col-start-2 sm:flex-row sm:flex-wrap sm:gap-3">
                  {reviewableItemIds?.has(item.id) && (
                    <Link
                      className="text-sm font-medium text-primary underline"
                      aria-label={`Đánh giá ${item.productName}`}
                      to={`/account/reviews?${new URLSearchParams({
                        tab: "pending",
                        orderItemId: item.id,
                      })}`}
                    >
                      <span>Đánh giá</span>
                    </Link>
                  )}
                  {returnOrderId && !item.returnStatus && (
                    <Link
                      className="text-sm font-medium text-primary underline"
                      aria-label={`Yêu cầu trả hàng cho ${item.productName}`}
                      to={`/account/returns/new?${new URLSearchParams({
                        orderId: returnOrderId,
                        orderItemId: item.id,
                      })}`}
                    >
                      <span>Yêu cầu trả hàng</span>
                    </Link>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
