import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Expand, ImageOff, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { PendingReview, ReviewResponse } from "../types";

function ReviewThumbnail({ url, large = false }: { url: string | null; large?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const size = large ? "size-16 sm:size-20" : "size-14";

  if (!url || failedUrl === url) {
    return (
      <span
        aria-hidden="true"
        className={`grid ${size} shrink-0 place-items-center rounded-xl border border-border/60 bg-muted text-muted-foreground`}
      >
        <ImageOff className="size-5" />
      </span>
    );
  }

  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailedUrl(url)}
      className={`${size} shrink-0 rounded-xl border border-border/60 bg-background p-2 object-contain`}
    />
  );
}

function VariantAttributes({ attributes }: { attributes: Record<string, unknown> | null }) {
  const entries = Object.entries(attributes ?? {}).filter(([, value]) =>
    typeof value === "string" || typeof value === "number" || typeof value === "boolean"
  );

  if (entries.length === 0) return null;

  return (
    <p className="text-sm text-muted-foreground wrap-anywhere">
      {entries.map(([name, value]) => `${name}: ${String(value)}`).join(" · ")}
    </p>
  );
}

export function ReviewAttachment({ url, thumbnail = false }: { url: string; thumbnail?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed || !/^(https?:\/\/|\/uploads\/)/i.test(url)) {
    return <p className="text-sm text-muted-foreground">Không tải được ảnh đánh giá.</p>;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Mở ảnh đánh giá trong tab mới"
      className={`group relative block overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${thumbnail ? "aspect-square w-full max-w-56" : "w-fit max-w-full"}`}
    >
      <img
        src={url}
        alt="Ảnh đính kèm đánh giá"
        loading="lazy"
        onError={() => setFailed(true)}
        className={thumbnail
          ? "size-full object-cover transition-transform duration-200 motion-safe:group-hover:scale-105"
          : "max-h-40 max-w-full object-contain"}
      />
      {thumbnail && (
        <span aria-hidden="true" className="absolute right-2 bottom-2 rounded-md bg-black/60 p-1.5 text-white transition-colors group-hover:bg-black/80">
          <Expand className="size-3.5" />
        </span>
      )}
    </a>
  );
}

export function PendingReviewCard({ item, onOpen }: {
  item: PendingReview;
  onOpen: () => void;
}) {
  return (
    <article className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex gap-3">
        <ReviewThumbnail url={item.productImage} />
        <div className="min-w-0">
          <h2 className="font-medium wrap-anywhere">{item.productName}</h2>
          <VariantAttributes attributes={item.variantAttributes} />
          <p className="text-sm text-muted-foreground">
            Đặt ngày {formatDateTime(item.orderDate)}
          </p>
        </div>
      </div>

      <Button type="button" variant="outline" aria-haspopup="dialog" onClick={onOpen}>
        Đánh giá
      </Button>
    </article>
  );
}

export function ReviewHistoryCard({ review, children }: { review: ReviewResponse; children?: ReactNode }) {
  const productAvailable = review.productId != null &&
    !review.productDeleted && !review.isProductDeleted;

  return (
    <article className="@container overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      <header className="flex items-start gap-4 border-b border-border/70 bg-muted/25 p-4 sm:p-5">
        <ReviewThumbnail url={review.productImage} large />
        <div className="min-w-0 flex-1 space-y-1.5">
          <h2 className="text-sm leading-6 font-semibold wrap-anywhere sm:text-base">
            {productAvailable ? (
              <Link className="rounded-sm transition-colors hover:text-primary hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" to={`/products/${review.productId}`}>
                {review.productName}
              </Link>
            ) : "Sản phẩm không còn khả dụng"}
          </h2>
          <VariantAttributes attributes={review.variantAttributes} />
          <p className="text-xs leading-5 text-muted-foreground">
            Đánh giá ngày <time dateTime={review.createdAt}>{formatDateTime(review.createdAt)}</time>
          </p>
        </div>
      </header>

      <div className={`grid gap-6 p-4 sm:p-6 ${review.imageUrl ? "@[34rem]:grid-cols-[minmax(0,1fr)_12rem]" : "grid-cols-1"}`}>
        <div className="min-w-0 space-y-5">
          <section className="rounded-xl bg-muted/50 px-4 py-3.5">
            <h3 className="text-xs font-medium text-muted-foreground">Số sao</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="flex items-baseline gap-1.5 tabular-nums">
                <span className="text-3xl font-semibold tracking-tight">{review.rating}</span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </p>
              <span role="img" aria-label={`${review.rating} trên 5 sao`} className="inline-flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => {
                  const fillPercentage = Math.min(100, Math.max(0, (review.rating - score + 1) * 100));
                  return (
                    <span key={score} aria-hidden="true" className="relative inline-flex">
                      <Star className="size-5 fill-muted text-border" strokeWidth={1.5} />
                      <Star
                        className="absolute inset-0 size-5 fill-amber-400 text-amber-500 dark:text-amber-400"
                        strokeWidth={1.5}
                        style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
                      />
                    </span>
                  );
                })}
              </span>
            </div>
          </section>
          {review.reviewText && (
            <section className="space-y-2.5">
              <h3 className="text-xs font-medium text-muted-foreground">Nhận xét</h3>
              <p className="text-sm leading-7 whitespace-pre-wrap wrap-anywhere">{review.reviewText}</p>
            </section>
          )}
        </div>
        {review.imageUrl && (
          <section className="min-w-0 space-y-3 border-t border-border/70 pt-5 @[34rem]:border-t-0 @[34rem]:border-l @[34rem]:pt-0 @[34rem]:pl-6">
            <h3 className="text-xs font-medium text-muted-foreground">Ảnh đính kèm</h3>
            <ReviewAttachment key={review.imageUrl} url={review.imageUrl} thumbnail />
          </section>
        )}
      </div>
      {children && (
        <footer className="border-t border-border/70 bg-muted/20 px-4 py-3 sm:px-5">
          {children}
        </footer>
      )}
    </article>
  );
}
