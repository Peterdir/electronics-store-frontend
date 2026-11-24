import { formatVND } from "@/lib/format";
import { useState, type ReactNode } from "react";
import { Boxes, Layers3, Package } from "lucide-react";
import type { AdminProductDetailResponse, AdminProductVariantResponse } from "../types";
import { ProductStatusBadge } from "./ProductStatusBadge";

function VariantThumbnail({ url, sku }: { url: string | null; sku: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 p-1.5">
    {url && !failed ? <img src={url} alt={`Biến thể ${sku}`} loading="lazy" className="size-full object-contain" onError={() => setFailed(true)} />
      : <Package aria-hidden="true" className="size-7 text-muted-foreground/60" />}
  </div>;
}

export function SavedProductVariants({ product, renderAction }: { product: AdminProductDetailResponse; renderAction?: (variant: AdminProductVariantResponse) => ReactNode }) {
  const variants = product.variants ?? [];
  const activeCount = variants.filter((variant) => variant.status === "ACTIVE").length;
  const productImage = product.images?.find((image) => image.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl;
  return (
    <section className="min-w-0 space-y-5 rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="flex items-center gap-2 text-lg font-semibold"><Layers3 aria-hidden="true" className="size-5 text-muted-foreground" />Biến thể sản phẩm{renderAction ? "" : " (chỉ xem)"}<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{variants.length}</span></h2>
          <p className="text-sm text-muted-foreground">{activeCount} đang bật bán · {variants.length - activeCount} ngừng bán hoặc ẩn</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          <Boxes aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Tổng tồn kho</span><strong className="tabular-nums">{product.totalStock}</strong>
        </div>
      </div>
      {product.status !== "ACTIVE" && variants.length > 0 && <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">Sản phẩm đang {product.status === "HIDDEN" ? "ẩn" : "ngừng bán"}. Các biến thể chưa thể được mua dù đã bật bán.</p>}
      {!variants.length ? <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-8 text-muted-foreground"><Package aria-hidden="true" className="size-8" /><p className="text-sm">Chưa có biến thể.</p></div> : (
        <ul className="grid items-stretch gap-4 xl:grid-cols-2">
          {variants.map((variant) => {
            const imageUrl = variant.imageUrl || variant.images?.find((image) => image.isPrimary)?.imageUrl || variant.images?.[0]?.imageUrl || productImage || null;
            const attributes = Object.entries(variant.attributes ?? {});
            return <li key={variant.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-background/40 shadow-sm transition-colors hover:border-primary/25">
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <VariantThumbnail key={imageUrl} url={imageUrl} sku={variant.sku} />
                <div className="min-w-0 flex-1 space-y-2">
                  <div><p className="text-xs font-medium tracking-wide text-muted-foreground">SKU</p><h3 className="font-mono text-sm leading-6 font-semibold wrap-anywhere">{variant.sku}</h3></div>
                  <ProductStatusBadge status={variant.status} />
                </div>
              </div>
              <dl className="mx-4 grid grid-cols-2 divide-x divide-border rounded-lg border border-border bg-muted/25 sm:mx-5">
                <div className="min-w-0 p-3"><dt className="text-xs text-muted-foreground">Giá bán</dt><dd className="mt-1 text-base font-semibold text-primary tabular-nums wrap-anywhere">{formatVND(variant.price)}</dd></div>
                <div className="min-w-0 p-3"><dt className="text-xs text-muted-foreground">Tồn kho</dt><dd className={`mt-1 text-base font-semibold tabular-nums ${variant.stock === 0 ? "text-amber-700 dark:text-amber-400" : "text-foreground"}`}>{variant.stock}<span className="ml-1.5 text-xs font-normal text-muted-foreground">sản phẩm</span></dd></div>
              </dl>
              <div className="flex-1 px-4 py-4 sm:px-5">
                {attributes.length ? <dl className="flex flex-wrap gap-2">{attributes.map(([key, value]) => <div key={key} className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs wrap-anywhere"><dt className="text-muted-foreground">{key}:</dt><dd className="font-medium">{typeof value === "string" ? value : JSON.stringify(value)}</dd></div>)}</dl>
                  : <p className="text-xs text-muted-foreground">Chưa có thuộc tính.</p>}
              </div>
              <div className="space-y-3 border-t border-border bg-muted/15 px-4 py-3 sm:px-5">
                <p className="font-mono text-[11px] text-muted-foreground wrap-anywhere" title={`Mã biến thể: ${variant.id}`}>ID · {variant.id}</p>
                {renderAction?.(variant)}
              </div>
            </li>
          })}
        </ul>
      )}
    </section>
  );
}
