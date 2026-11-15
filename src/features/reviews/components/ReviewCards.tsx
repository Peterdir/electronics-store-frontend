import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { PendingReview, ReviewResponse } from "../types";

function ReviewThumbnail({ url }: { url: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!url || failedUrl === url) {
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
      onError={() => setFailedUrl(url)}
      className="size-14 shrink-0 rounded-lg bg-muted object-contain"
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

function ReviewAttachment({ url }: { url: string }) {
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
      className="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
    >
      <img
        src={url}
        alt="Ảnh đính kèm đánh giá"
        loading="lazy"
        onError={() => setFailed(true)}
        className="max-h-40 max-w-full rounded-lg border border-border bg-muted object-contain"
      />
    </a>
  );
}

export function PendingReviewCard({ item, onOpen, children }: {
  item: PendingReview;
  onOpen: () => void;
  children?: ReactNode;
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

      {children ?? (
        <Button type="button" variant="outline" onClick={onOpen}>
          Đánh giá
        </Button>
      )}
    </article>
  );
}

export function ReviewHistoryCard({ review }: { review: ReviewResponse }) {
  const productAvailable = review.productId != null &&
    !review.productDeleted && !review.isProductDeleted;

  return (
    <article className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex gap-3">
        <ReviewThumbnail url={review.productImage} />
        <div className="min-w-0">
          <h2 className="font-medium wrap-anywhere">
            {productAvailable ? (
              <Link className="text-primary underline" to={`/products/${review.productId}`}>
                {review.productName}
              </Link>
            ) : "Sản phẩm không còn khả dụng"}
          </h2>
          <VariantAttributes attributes={review.variantAttributes} />
          <p className="text-sm text-muted-foreground">{formatDateTime(review.createdAt)}</p>
        </div>
      </div>

      <p className="font-medium">{review.rating}/5 sao</p>
      {review.reviewText && (
        <p className="whitespace-pre-wrap wrap-anywhere">{review.reviewText}</p>
      )}
      {review.imageUrl && <ReviewAttachment key={review.imageUrl} url={review.imageUrl} />}
    </article>
  );
}
