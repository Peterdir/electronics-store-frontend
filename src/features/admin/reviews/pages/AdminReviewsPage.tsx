import { useEffect, useState, type SubmitEvent } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { CircleCheck, EyeOff } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { CompactStatusBadge } from "@/shared/components/CompactStatusBadge";
import { Pagination } from "@/shared/components/Pagination";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { ReviewReplyForm } from "../components/ReviewReplyForm";
import { ReviewVisibilityAction } from "../components/ReviewVisibilityAction";
import { parseReviewFilters, REVIEW_PAGE_SIZES, REVIEW_RATINGS, serializeReviewFilters } from "../filters";
import { useAdminReviews, useReviewsSession, type ReviewsSession } from "../queries";
import type { AdminReview, ReviewFilters } from "../types";

const fieldClassName = "h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";

export function AdminReviewsPage() {
  const snapshot = useReviewsSession();
  if (!snapshot) return <p role="alert">Vui lòng đăng nhập lại.</p>;

  return (
    <AdminReviewsContent
      key={`${snapshot.userId}:${snapshot.role}:${snapshot.token}`}
      snapshot={snapshot}
    />
  );
}

function AdminReviewsContent({ snapshot }: { snapshot: ReviewsSession }) {
  const [search, setSearch] = useSearchParams();
  const filters = parseReviewFilters(search);
  const canonicalSearch = serializeReviewFilters(filters).toString();
  const query = useAdminReviews(filters, snapshot);
  const [notice, setNotice] = useState("");
  const [blockedIds, setBlockedIds] = useState<Set<string>>(() => new Set());
  const [missingIds, setMissingIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (search.toString() !== canonicalSearch) setSearch(canonicalSearch, { replace: true });
  }, [search, canonicalSearch, setSearch]);

  useEffect(() => {
    if (query.data && !query.isFetching && !query.isError && filters.page > Math.max(1, query.data.totalPages)) {
      setSearch(serializeReviewFilters({
        productName: filters.productName,
        rating: filters.rating,
        size: filters.size,
        page: Math.max(1, query.data.totalPages),
      }), { replace: true });
    }
  }, [query.data, query.isFetching, query.isError, filters.page, filters.rating, filters.productName, filters.size, setSearch]);

  function changeFilters(patch: Partial<ReviewFilters>) {
    setSearch(serializeReviewFilters({ ...filters, ...patch }));
  }

  const columns: DataTableColumn<AdminReview, never>[] = [
    {
      id: "product",
      header: "Sản phẩm / khách hàng",
      align: "left",
      cell: (review) => (
        <div className="max-w-64 wrap-anywhere">
          <p className="font-semibold">{review.productName ?? "Không còn thông tin sản phẩm"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {review.customerName ?? "Khách hàng"} • #{review.id}
          </p>
        </div>
      ),
    },
    {
      id: "rating",
      header: "Số sao",
      cell: (review) => (
        <span className="whitespace-nowrap font-medium" aria-label={`${review.rating} trên 5 sao`}>
          <span aria-hidden="true" className="text-amber-500">★</span> {review.rating}/5
        </span>
      ),
    },
    {
      id: "content",
      header: "Đánh giá / trả lời",
      align: "left",
      cell: (review) => (
        <div className="max-w-sm space-y-3 text-sm whitespace-pre-wrap wrap-anywhere">
          <p>{review.reviewText || "Không có nội dung chữ."}</p>
          {review.adminReply && (
            <div className="rounded-lg border-l-2 border-primary bg-muted/40 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Cửa hàng trả lời</p>
              <p className="mt-1">{review.adminReply}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "hidden",
      header: "Hiển thị",
      cell: (review) => (
        <CompactStatusBadge
          caption="Hiển thị đánh giá"
          label={review.hidden ? "Đang ẩn" : "Đang hiện"}
          tone={review.hidden ? "pending" : "success"}
          icon={review.hidden ? EyeOff : CircleCheck}
        />
      ),
    },
    {
      id: "createdAt",
      header: "Ngày tạo",
      cell: (review) => formatDateTime(review.createdAt),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: (review) => {
        const props = {
          review,
          snapshot,
          blocked: blockedIds.has(review.id),
          onBlocked: () => setBlockedIds((current) => new Set([...current, review.id])),
          onMissing: () => setMissingIds((current) => new Set([...current, review.id])),
          onNotice: setNotice,
        };

        return (
          <div className="flex flex-wrap justify-center gap-2">
            <ReviewReplyForm {...props} />
            <ReviewVisibilityAction {...props} />
            {props.blocked && (
              <p className="w-full max-w-48 text-xs text-destructive">Đã khóa gửi. Hãy đối chiếu kết quả máy chủ.</p>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <section className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Quản lý đánh giá"
        description="Xem đánh giá theo sản phẩm và số sao, trả lời khách hàng hoặc điều chỉnh trạng thái hiển thị."
      />
      <ReviewFiltersForm
        key={canonicalSearch}
        filters={filters}
        onApply={(productName, rating) => changeFilters({ productName, rating, page: 1 })}
        onSizeChange={(size) => changeFilters({ size, page: 1 })}
      />
      <div aria-busy={query.isFetching} className="space-y-4">
      {notice && <p role="status" className="rounded-xl border border-border bg-card p-4 text-sm leading-6">{notice}</p>}
      {query.isPending && <p role="status">Đang tải đánh giá…</p>}
      {query.isError && (
        <p role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">
          {query.error.message} {query.data ? "Đang hiển thị dữ liệu cũ. " : ""}Nhấn F5 để tải lại trang.
        </p>
      )}
      {query.data && (
        <>
          <p role="status" className="text-sm text-muted-foreground">
            {query.data.totalItems} đánh giá{query.isFetching ? " · Đang cập nhật…" : ""}
          </p>
          <DataTable
            caption="Danh sách đánh giá sản phẩm"
            rows={query.data.items.filter((review) => !missingIds.has(review.id))}
            columns={columns}
            rowKey={(review) => review.id}
            emptyMessage="Không có đánh giá phù hợp."
          />
          <Pagination
            currentPage={filters.page}
            totalPages={query.data.totalPages}
            isFetching={query.isFetching}
            onPageChange={(page) => changeFilters({ page })}
            ariaLabel="Phân trang đánh giá"
          />
        </>
      )}
      </div>
    </section>
  );
}

function ReviewFiltersForm({
  filters, onApply, onSizeChange,
}: {
  filters: ReviewFilters;
  onApply: (productName: string, rating: number | null) => void;
  onSizeChange: (size: number) => void;
}) {
  const [productName, setProductName] = useState(filters.productName);
  const [rating, setRating] = useState(filters.rating === null ? "" : String(filters.rating));

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply(productName.trim(), REVIEW_RATINGS.find((value) => String(value) === rating) ?? null);
  }

  return (
    <form
      onSubmit={submit}
      className="min-w-0"
    >
      <FilterBar>
      <label className="grid min-w-48 flex-1 gap-2 text-sm font-medium">
        Tên sản phẩm
        <input
          type="search"
          value={productName}
          onChange={(event) => setProductName(event.target.value)}
          placeholder="Nhập tên sản phẩm…"
          className={`${fieldClassName} w-full`}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Số sao
        <select
          value={rating}
          onChange={(event) => setRating(event.target.value)}
          className={fieldClassName}
        >
          <option value="">Tất cả</option>
          {REVIEW_RATINGS.map((value) => (
            <option key={value} value={value}>{value} sao</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Số dòng
        <select
          value={filters.size}
          onChange={(event) => onSizeChange(Number(event.target.value))}
          className={fieldClassName}
        >
          {REVIEW_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size} / trang</option>
          ))}
        </select>
      </label>
      <Button type="submit" className="h-10">Lọc đánh giá</Button>
      <Button
        type="button"
        variant="outline"
        className="h-10"
        onClick={() => {
          setProductName("");
          setRating("");
          onApply("", null);
        }}
      >
        Xóa bộ lọc
      </Button>
      </FilterBar>
    </form>
  );
}
