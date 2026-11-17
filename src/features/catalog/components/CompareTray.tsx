import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ArrowRightLeft, ChevronDown, ImageOff, Plus, Trash2, X } from "lucide-react";
import { Link } from "react-router";
import { formatVND } from "@/lib/format";
import type { ID } from "@/shared/types/common";
import { useCompare } from "../compare.store";
import { useGetProductDetails } from "../queries";

function CompareProductCard({ id, onRemove }: { id: ID; onRemove: () => void }) {
  const { data: product, isPending, isError, refetch } = useGetProductDetails(id);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const variant = product?.variants?.find((item) => item.status === "ACTIVE");
  const variantImage = [...(variant?.images ?? [])].sort(
    (a, b) => Number(b.isPrimary === true) - Number(a.isPrimary === true) || a.displayOrder - b.displayOrder,
  )[0]?.imageUrl;
  const imageUrl = variantImage || variant?.imageUrl || product?.images?.[0];
  const name = product?.name ?? `Sản phẩm #${id}`;

  return (
    <li className="group relative w-56 shrink-0 snap-start rounded-xl border border-border bg-background transition-colors hover:border-primary/40 xl:w-auto xl:min-w-0" aria-busy={isPending}>
      <Link
        to={`/products/${id}`}
        aria-label={`Xem chi tiết ${name}`}
        className="flex min-h-24 items-center gap-3 rounded-xl p-3 pr-9 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/60 sm:size-16">
          {isPending ? (
            <div className="size-full bg-muted motion-safe:animate-pulse" />
          ) : imageUrl && failedImage !== imageUrl ? (
            <img src={imageUrl} alt={name} onError={() => setFailedImage(imageUrl)} className="size-full object-contain p-1.5" />
          ) : (
            <ImageOff aria-hidden="true" className="size-5 text-muted-foreground/60" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          {isPending ? (
            <>
              <span className="sr-only">Đang tải thông tin sản phẩm</span>
              <div className="h-3 w-full rounded bg-muted motion-safe:animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-muted motion-safe:animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-muted motion-safe:animate-pulse" />
            </>
          ) : (
            <>
              <p className="line-clamp-2 text-xs font-medium leading-5 group-hover:text-primary" title={name}>{name}</p>
              {product && <p className="text-xs font-semibold tabular-nums text-primary">{formatVND(product.basePrice)}</p>}
            </>
          )}
        </div>
      </Link>

      {isError && (
        <button type="button" onClick={() => void refetch()} className="mb-2 ml-3 text-xs text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ring">
          Tải lại thông tin
        </button>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Bỏ ${name} khỏi danh sách so sánh`}
        title="Bỏ so sánh"
        className="absolute right-0.5 top-0.5 flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring"
      >
        <X aria-hidden="true" className="size-3.5" />
      </button>
    </li>
  );
}

export function CompareTray({ onHeightChange }: { onHeightChange?: (height: number) => void }) {
  const ids = useCompare((state) => state.compareIds);
  const categoryName = useCompare((state) => state.categoryName);
  const remove = useCompare((state) => state.remove);
  const clear = useCompare((state) => state.clear);
  const [collapsed, setCollapsed] = useState(false);
  const trayRef = useRef<HTMLElement>(null);
  const contentId = useId();
  const canCompare = ids.length >= 2;
  const compareUrl = `/compare?ids=${ids.join(",")}`;

  useEffect(() => {
    const element = trayRef.current;
    if (!element || !onHeightChange) return;

    const observer = new ResizeObserver(() => {
      onHeightChange(element.getBoundingClientRect().height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [onHeightChange, ids.length]);

  if (ids.length === 0) return null;

  return (
    <section
      ref={trayRef}
      aria-label="Danh sách so sánh"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300"
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-border bg-card/95 shadow-[0_-4px_40px_-12px_rgb(0_0_0/0.2)] backdrop-blur-xl dark:shadow-[0_-4px_40px_-12px_rgb(0_0_0/0.65)]">
        <div className="flex min-h-16 items-center justify-between gap-2 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <span className={`flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary transition-[width,opacity] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${collapsed ? "w-0 opacity-0 sm:w-9 sm:opacity-100" : "w-9 opacity-100"}`}>
              <ArrowRightLeft aria-hidden="true" className="size-4 shrink-0" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold">So sánh<span className="hidden sm:inline"> sản phẩm</span></h2>
                <span aria-label={`Đã chọn ${ids.length} trên tối đa 4 sản phẩm`} className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-primary">{ids.length}/4</span>
              </div>
              {categoryName && <p className="truncate text-xs text-muted-foreground">{categoryName}</p>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {canCompare && (
              <div
                inert={!collapsed}
                aria-hidden={!collapsed}
                className={`overflow-hidden transition-[max-width,opacity] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${collapsed ? "max-w-28 opacity-100" : "max-w-0 opacity-0"}`}
              >
                <Link to={compareUrl} className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                  So sánh <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </div>
            )}
            <button type="button" onClick={clear} aria-label="Xóa tất cả sản phẩm so sánh" title="Xóa tất cả" className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-ring">
              <Trash2 aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">Xóa tất cả</span>
            </button>
            <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-border" />
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-expanded={!collapsed}
              aria-controls={contentId}
              aria-label={collapsed ? "Mở rộng danh sách so sánh" : "Thu gọn danh sách so sánh"}
              title={collapsed ? "Mở rộng" : "Thu gọn"}
              className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <ChevronDown aria-hidden="true" className={`size-4 transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${collapsed ? "-rotate-180" : "rotate-0"}`} />
            </button>
          </div>
        </div>

        <div
          id={contentId}
          inert={collapsed}
          aria-hidden={collapsed}
          className={`grid transition-[grid-template-rows,opacity] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className={`gap-4 border-t border-border/70 p-3 transition-transform duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-5 sm:py-4 lg:flex lg:items-center ${collapsed ? "translate-y-2" : "translate-y-0"}`}>
              <ul aria-label="Sản phẩm đã chọn" className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 xl:overflow-visible xl:pb-0">
                {ids.map((id) => <CompareProductCard key={id} id={id} onRemove={() => remove(id)} />)}
                {Array.from({ length: 4 - ids.length }, (_, index) => (
                  <li key={`empty-${index}`} aria-hidden="true" className={`${index === 0 ? "flex" : "hidden xl:flex"} min-h-24 w-44 shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground xl:w-auto xl:min-w-0`}>
                    <Plus className="size-4 text-muted-foreground/60" />
                    <span className="text-[11px]">Chọn thêm sản phẩm</span>
                  </li>
                ))}
              </ul>

              <div className="mt-2 flex items-center justify-between gap-3 border-t border-border/70 pt-3 lg:mt-0 lg:w-44 lg:shrink-0 lg:flex-col lg:gap-2 lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
                <p role="status" className="text-xs leading-5 text-muted-foreground lg:text-center">
                  {canCompare ? `Đã chọn ${ids.length} sản phẩm` : "Chọn thêm 1 sản phẩm để so sánh"}
                </p>
                {canCompare ? (
                  <Link to={compareUrl} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:w-full">
                    So sánh ngay <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                ) : (
                  <button type="button" disabled className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-muted px-5 text-sm font-medium text-muted-foreground lg:w-full">
                    So sánh ngay <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
