import { useState } from "react";
import { Link } from "react-router";
import { ImageOff } from "lucide-react";
import { formatVND } from "@/lib/format";
import { WishlistToggleButton } from "./WishlistToggleButton";
import type { WishlistItemResponse } from "../types";

export function WishlistCard({ item }: { item: WishlistItemResponse }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const detailUrl = `/products/${item.productId}`;
  const canChooseVariant = item.productStatus === "ACTIVE" && item.inStock;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <Link
        to={detailUrl}
        aria-label={`Xem chi tiết ${item.productName}`}
        className="flex aspect-square items-center justify-center bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {item.primaryImageUrl && item.primaryImageUrl !== failedImageUrl ? (
          <img
            src={item.primaryImageUrl}
            alt={item.productName}
            loading="lazy"
            onError={() => setFailedImageUrl(item.primaryImageUrl)}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <ImageOff aria-hidden="true" className="size-8" />
            Chưa có ảnh
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h2 className="wrap-anywhere font-semibold">
          <Link to={detailUrl} className="hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">
            {item.productName}
          </Link>
        </h2>
        <p className="text-lg font-semibold tabular-nums text-primary">{formatVND(item.price)}</p>
        <p className="text-sm text-muted-foreground">
          {item.productStatus !== "ACTIVE" ? "Sản phẩm hiện không mở bán"
            : item.inStock ? "Còn hàng" : "Hết hàng"}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {canChooseVariant ? (
            <Link
              to={detailUrl}
              className="inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              Chọn phiên bản
            </Link>
          ) : (
            <button type="button" disabled className="min-h-11 rounded-lg bg-muted px-3 text-sm text-muted-foreground">
              Chọn phiên bản
            </button>
          )}
          <WishlistToggleButton productId={item.productId} productName={item.productName} />
        </div>
      </div>
    </article>
  );
}
