import { useState } from "react";
import { Star, Undo2 } from "lucide-react";
import { Link } from "react-router";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ID } from "@/shared/types/common";
import type { ReturnStatus } from "@/shared/types/enums";
import type { OrderItemResponse } from "../types";

const itemActionClass = "inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-center text-sm font-semibold outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-reduce:transition-none sm:flex-none";

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
                      className={cn(itemActionClass, "border-primary/20 bg-primary text-primary-foreground shadow-sm hover:border-primary/40 hover:bg-primary/90 hover:shadow-md")}
                      aria-label={`Đánh giá ${item.productName}`}
                      to={`/account/reviews?${new URLSearchParams({
                        tab: "pending",
                        orderItemId: item.id,
                      })}`}
                    >
                      <Star aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                      <span>Đánh giá</span>
                    </Link>
                  )}
                  {returnOrderId && !item.returnStatus && (
                    <Link
                      className={cn(itemActionClass, "border-border bg-background/60 text-muted-foreground shadow-xs hover:border-foreground/25 hover:bg-muted hover:text-foreground hover:shadow-sm")}
                      aria-label={`Yêu cầu trả hàng cho ${item.productName}`}
                      to={`/account/returns/new?${new URLSearchParams({
                        orderId: returnOrderId,
                        orderItemId: item.id,
                      })}`}
                    >
                      <Undo2 aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
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
