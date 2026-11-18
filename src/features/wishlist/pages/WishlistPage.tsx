import { Heart } from "lucide-react";
import { Link } from "react-router";
import { ApiError } from "@/shared/api/errors";
import { WishlistCard } from "../components/WishlistCard";
import { useWishlistState } from "../queries";

export function WishlistPage() {
  const { query, productIds, busy } = useWishlistState();
  const items = (query.data ?? []).filter((item) => productIds.has(item.productId));

  return (
    <section className="min-w-0 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Sản phẩm yêu thích</h1>
        <p className="mt-2 text-sm text-muted-foreground">Lưu sản phẩm bạn quan tâm và chọn phiên bản khi muốn mua.</p>
      </div>

      {query.fetchStatus === "paused" && <p role="status">Đang chờ kết nối mạng…</p>}
      {query.isPending && query.fetchStatus !== "paused" && <p role="status">Đang tải danh sách yêu thích…</p>}

      {query.isError && (
        <div className="space-y-3 rounded-xl border border-destructive/30 p-4">
          <p role="alert">
            {query.error instanceof ApiError && query.error.status === 403
              ? "Bạn không có quyền xem danh sách yêu thích."
              : "Chưa tải được danh sách yêu thích mới nhất. Hãy tải lại trước khi tiếp tục thay đổi."}
          </p>
          <button
            type="button"
            disabled={query.fetchStatus !== "idle" || busy}
            onClick={() => void query.refetch()}
            className="min-h-11 rounded-lg border border-border px-4 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
          >
            {query.isFetching ? "Đang tải…" : "Thử lại"}
          </button>
        </div>
      )}

      {query.isFetching && query.data !== undefined && (
        <p role="status" className="text-sm text-muted-foreground">Đang làm mới danh sách…</p>
      )}

      {query.isSuccess && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-8 text-center">
          <Heart aria-hidden="true" className="size-10 text-muted-foreground" />
          <p role="status">{busy ? "Đang cập nhật danh sách…" : "Bạn chưa có sản phẩm yêu thích."}</p>
          {!busy && <Link to="/products" className="text-primary underline">Khám phá sản phẩm</Link>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => <WishlistCard key={item.productId} item={item} />)}
      </div>
    </section>
  );
}
