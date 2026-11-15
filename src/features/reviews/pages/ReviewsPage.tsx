import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { isPositiveLongId, type ID } from "@/shared/types/common";
import { PendingReviewCard, ReviewHistoryCard } from "../components/ReviewCards";
import { ReviewForm } from "../components/ReviewForm";
import { usePendingReviews, useReviewHistory } from "../queries";

export function ReviewsPage() {
  const [search, setSearch] = useSearchParams();
  const tab = search.get("tab") === "history" ? "history" : "pending";
  const pending = usePendingReviews(tab === "pending");
  const history = useReviewHistory(tab === "history");
  const active = tab === "pending" ? pending : history;

  const rawItemId = search.get("orderItemId") ?? undefined;
  const selectedItemId = isPositiveLongId(rawItemId) ? rawItemId : undefined;
  const pendingVerified = pending.isSuccess && pending.fetchStatus === "idle";
  const selectedItemMissing = rawItemId !== undefined && pendingVerified &&
    !pending.data.some((item) => item.orderItemId === selectedItemId);

  function openReview(orderItemId: ID) {
    setSearch({ tab: "pending", orderItemId });
  }

  function closeReview() {
    setSearch({ tab: "pending" }, { replace: true });
  }

  return (
    <section className="min-w-0 space-y-4">
      <h1 className="text-2xl font-bold">Đánh giá của tôi</h1>
      <nav aria-label="Nhóm đánh giá" className="flex flex-wrap gap-2">
        {(["pending", "history"] as const).map((value) => (
          <Link
            key={value}
            to={`?tab=${value}`}
            aria-current={tab === value ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm ${tab === value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"}`}
          >
            {value === "pending" ? "Chờ đánh giá" : "Đã đánh giá"}
          </Link>
        ))}
      </nav>

      {active.fetchStatus === "paused" && <p role="status">Đang chờ kết nối mạng…</p>}
      {active.isPending && active.fetchStatus !== "paused" && (
        <p role="status">Đang tải đánh giá…</p>
      )}

      {active.isError && (
        <div className="space-y-2">
          <p role="alert">
            {active.error instanceof ApiError
              ? active.error.message
              : "Không tải được danh sách đánh giá."}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={active.fetchStatus !== "idle"}
            onClick={() => { void active.refetch(); }}
          >
            Thử lại
          </Button>
        </div>
      )}

      {active.data && active.isFetching && (
        <p role="status" className="text-sm text-muted-foreground">Đang cập nhật…</p>
      )}

      {tab === "pending" && pending.data && (
        <div className="space-y-3">
          {selectedItemMissing && (
            <p role="status">Dòng đơn hàng này không còn trong danh sách chờ đánh giá.</p>
          )}
          {pending.data.length === 0 && <p>Bạn chưa có sản phẩm nào chờ đánh giá.</p>}
          {pending.data.map((item) => (
            <PendingReviewCard
              key={item.orderItemId}
              item={item}
              onOpen={() => openReview(item.orderItemId)}
            >
              {item.orderItemId === selectedItemId
                ? <ReviewForm item={item} canSubmit={pendingVerified} onClose={closeReview} />
                : undefined}
            </PendingReviewCard>
          ))}
        </div>
      )}

      {tab === "history" && history.data && (
        <div className="space-y-3">
          {history.data.length === 0 && <p>Bạn chưa gửi đánh giá nào.</p>}
          {history.data.map((review) => <ReviewHistoryCard key={review.id} review={review} />)}
        </div>
      )}
    </section>
  );
}
