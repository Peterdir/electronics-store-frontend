import { Link, useSearchParams } from "react-router";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { useSession } from "@/shared/auth/session.store";
import { isPositiveLongId, type ID } from "@/shared/types/common";
import { PendingReviewCard, ReviewHistoryCard } from "../components/ReviewCards";
import { ReviewDialog } from "../components/ReviewDialog";
import { ReviewHistoryActions } from "../components/ReviewHistoryActions";
import { usePendingReviews, useReviewHistory } from "../queries";

export function ReviewsPage() {
  const userId = useSession((state) => state.user?.id);
  const [search, setSearch] = useSearchParams();
  const tab = search.get("tab") === "history" ? "history" : "pending";
  const pending = usePendingReviews(tab === "pending");
  const history = useReviewHistory(tab === "history");
  const active = tab === "pending" ? pending : history;

  const rawItemId = search.get("orderItemId") ?? undefined;
  const selectedItemId = isPositiveLongId(rawItemId) ? rawItemId : undefined;
  const pendingVerified = pending.isSuccess && pending.fetchStatus === "idle";
  const selectedItem = tab === "pending"
    ? pending.data?.find((item) => item.orderItemId === selectedItemId)
    : undefined;
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
              key={`${userId}-${item.orderItemId}`}
              item={item}
              onOpen={() => openReview(item.orderItemId)}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <ReviewDialog
          key={`${userId}-${selectedItem.orderItemId}`}
          open
          item={selectedItem}
          canSubmit={pendingVerified}
          onClose={closeReview}
        />
      )}

      {tab === "history" && history.data && (
        <div className="space-y-5">
          {history.data.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Star aria-hidden="true" className="size-6" />
              </span>
              <p className="text-sm text-muted-foreground">Bạn chưa gửi đánh giá nào.</p>
            </div>
          )}
          {history.data.map((review) => (
            <ReviewHistoryCard key={`${userId}-${review.id}`} review={review}>
              <ReviewHistoryActions
                review={review}
                canSubmit={history.isSuccess && history.fetchStatus === "idle"}
              />
            </ReviewHistoryCard>
          ))}
        </div>
      )}
    </section>
  );
}
