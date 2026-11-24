import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { ApiError } from "@/shared/api/errors";
import { isPositiveLongId } from "@/shared/types/common";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { EditProductForm } from "../components/EditProductForm";
import { ProductImageManager } from "../components/ProductImageManager";
import { ProductLifecycleManager } from "../components/ProductLifecycleManager";
import { isCurrentProductSession, useAdminProductDetail, useProductSession } from "../queries";

export function EditProductPage() {
  const { id } = useParams();
  const productId = isPositiveLongId(id) ? id : undefined;
  const session = useProductSession();
  const query = useAdminProductDetail(productId);
  const product = query.data;
  const status = query.error instanceof ApiError ? query.error.status : undefined;
  const unavailable = status === 403 || status === 404;

  async function reload() {
    const result = await query.refetch();
    if (result.isError) throw result.error;
    if (!result.data) throw new Error("Không tải được sản phẩm.");
    return result.data;
  }

  if (!isCurrentProductSession(session)) return <p role="alert">Phiên quản trị không hợp lệ. Vui lòng đăng nhập lại.</p>;
  return (
    <section className="min-w-0 space-y-6">
      <Link to="/admin/products" className="inline-block text-sm text-primary underline underline-offset-4">Về danh sách sản phẩm</Link>
      <AdminPageHeader title="Sửa sản phẩm" />
      {!productId ? <p role="alert">Mã sản phẩm không hợp lệ.</p> : !product ? (
        query.isError ? (
          <div role="alert" className="space-y-3">
            <p>{status === 404 ? "Không tìm thấy sản phẩm." : status === 403 ? "Bạn không có quyền xem sản phẩm này." : query.error.message}</p>
            <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Thử tải lại</Button>
          </div>
        ) : <p role="status">{query.fetchStatus === "paused" ? "Đang chờ kết nối mạng…" : "Đang tải sản phẩm…"}</p>
      ) : (
        <div className="space-y-6" aria-busy={query.isFetching}>
          {query.isError && <p role="alert">Không cập nhật được dữ liệu: {query.error.message} Bản nháp được giữ lại; dữ liệu xem có thể chưa mới nhất.</p>}
          <ProductLifecycleManager key={`lifecycle:${session.userId}:${session.role}:${productId}`} product={product} session={session} unavailable={unavailable} reload={reload}>
            {({ statusControl, variants }) => (
              <>
                <div className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <span className="inline-flex min-h-9 items-center text-sm wrap-anywhere">Sản phẩm #{product.id}</span>
                  <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">{statusControl}</div>
                  <span className="inline-flex min-h-9 items-center text-sm text-muted-foreground">Cập nhật: {formatDateTime(product.updatedAt)}</span>
                  <Button size="lg" variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? "Đang tải…" : "Tải lại dữ liệu nền"}</Button>
                </div>
                <EditProductForm key={`${session.userId}:${session.role}:${productId}`} product={product} session={session} unavailable={unavailable} reload={reload} />
                {variants}
              </>
            )}
          </ProductLifecycleManager>
          <ProductImageManager key={`images:${session.userId}:${session.role}:${productId}`} product={product} session={session} unavailable={unavailable} reload={reload} />
        </div>
      )}
    </section>
  );
}
