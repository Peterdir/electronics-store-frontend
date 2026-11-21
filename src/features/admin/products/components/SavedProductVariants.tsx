import { formatVND } from "@/lib/format";
import type { AdminProductDetailResponse } from "../types";
import { ProductStatusBadge } from "./ProductStatusBadge";

export function SavedProductVariants({ product }: { product: AdminProductDetailResponse }) {
  return (
    <section className="min-w-0 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Biến thể đã lưu (chỉ xem)</h2>
      <p className="text-sm text-muted-foreground">E10 chỉ sửa thông tin chung. SKU, giá bán, thuộc tính và tồn kho của biến thể không được gửi trong lần lưu này. Sửa thông tin biến thể cần API backend tách riêng khỏi cập nhật kho.</p>
      <p className="text-sm">Tổng tồn từ máy chủ: <strong>{product.totalStock}</strong></p>
      {!product.variants?.length ? <p>Chưa có biến thể.</p> : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {product.variants.map((variant) => (
            <li key={variant.id} className="min-w-0 space-y-3 rounded-lg border border-border p-4 wrap-anywhere">
              <h3 className="font-semibold">{variant.sku}</h3>
              <ProductStatusBadge status={variant.status} />
              <dl className="space-y-2 text-sm">
                <div><dt className="text-muted-foreground">Mã biến thể</dt><dd>{variant.id}</dd></div>
                <div><dt className="text-muted-foreground">Giá bán</dt><dd>{formatVND(variant.price)}</dd></div>
                <div><dt className="text-muted-foreground">Tồn kho</dt><dd>{variant.stock}</dd></div>
                {Object.entries(variant.attributes ?? {}).map(([key, value]) => (
                  <div key={key}><dt className="text-muted-foreground">{key}</dt><dd>{typeof value === "string" ? value : JSON.stringify(value)}</dd></div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
