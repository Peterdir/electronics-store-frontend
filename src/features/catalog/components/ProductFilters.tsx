import { useEffect, useEffectEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ID } from "@/shared/types/common";
import { ActiveStatus, ProductSort } from "@/shared/types/enums";
import { useCategoryPriceBounds, useGetBrands } from "../queries";
import type { CategoryResponse } from "../types";
import { buildCategoryPriceRanges, parsePriceRange, type PriceRange } from "../priceFilters";

export interface ProductFilterValues {
  categoryId: ID;
  brandId?: ID;
  minPrice?: number;
  maxPrice?: number;
  sort: ProductSort;
}

interface ProductFiltersProps {
  values: ProductFilterValues;
  categories: CategoryResponse[];
  onChange: (values: ProductFilterValues, options?: { replace?: boolean }) => void;
}

interface PriceDraft {
  minPrice: string;
  maxPrice: string;
}

function formatPriceInput(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function ProductFilters({ values, categories, onChange }: ProductFiltersProps) {
  const brandsQuery = useGetBrands();
  const boundsQuery = useCategoryPriceBounds(values.categoryId);
  const priceErrorId = useId();
  const bounds = boundsQuery.data;
  const brands = brandsQuery.data?.filter((brand) => brand.status === ActiveStatus.ACTIVE) ?? [];
  const priceRanges = bounds ? buildCategoryPriceRanges(bounds) : [];
  const pricesDisabled = !bounds;

  const [priceDraft, setPriceDraft] = useState<PriceDraft | null>(null);
  const [previousPrices, setPreviousPrices] = useState({
    minPrice: values.minPrice,
    maxPrice: values.maxPrice,
  });

  if (previousPrices.minPrice !== values.minPrice || previousPrices.maxPrice !== values.maxPrice) {
    setPreviousPrices({ minPrice: values.minPrice, maxPrice: values.maxPrice });
    setPriceDraft(null);
  }

  const minPrice = priceDraft?.minPrice ?? String(values.minPrice ?? bounds?.minPrice ?? "");
  const maxPrice = priceDraft?.maxPrice ?? String(values.maxPrice ?? bounds?.maxPrice ?? "");
  const parsedPrices = parsePriceRange(minPrice, maxPrice);
  const priceError = parsedPrices.valid ? null : parsedPrices.error;

  function applyPriceRange(range: Pick<PriceRange, "minPrice" | "maxPrice">, replace = false) {
    const nextMinPrice = range.minPrice === bounds?.minPrice ? undefined : range.minPrice;
    const nextMaxPrice = range.maxPrice === bounds?.maxPrice ? undefined : range.maxPrice;

    if (nextMinPrice === values.minPrice && nextMaxPrice === values.maxPrice) return;
    onChange({ ...values, minPrice: nextMinPrice, maxPrice: nextMaxPrice }, { replace });
  }

  const applyDraftPrices = useEffectEvent(() => {
    const result = parsePriceRange(minPrice, maxPrice);
    if (result.valid) applyPriceRange(result, true);
  });

  useEffect(() => {
    if (!priceDraft || priceError || pricesDisabled) return;
    const timeoutId = window.setTimeout(() => applyDraftPrices(), 350);
    return () => window.clearTimeout(timeoutId);
  }, [priceDraft, priceError, pricesDisabled]);

  function changePrice(field: keyof PriceDraft, input: string) {
    const rawValue = input.replace(/\./g, "");
    if (!/^\d*$/.test(rawValue)) return;
    setPriceDraft({ minPrice, maxPrice, [field]: rawValue });
  }

  function clearFilters() {
    setPriceDraft(null);
    onChange({ categoryId: values.categoryId, sort: ProductSort.NEWEST });
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <label className="space-y-1">
          <span className="block text-sm font-medium">Danh mục</span>
          <select
            value={values.categoryId}
            onChange={(event) => {
              setPriceDraft(null);
              onChange({
                ...values,
                categoryId: event.target.value,
                minPrice: undefined,
                maxPrice: undefined,
              });
            }}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="block text-sm font-medium">Thương hiệu</span>
          <select
            value={values.brandId ?? ""}
            onChange={(event) => onChange({ ...values, brandId: event.target.value || undefined })}
            disabled={brandsQuery.isPending || brandsQuery.isError}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Tất cả thương hiệu</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </label>

        {priceRanges.length > 0 && (
          <fieldset className="space-y-3 sm:col-span-2 lg:col-span-1">
            <legend className="mb-2 text-sm font-medium">Khoảng giá</legend>
            <p className="text-xs text-muted-foreground">Chọn một khoảng giá</p>
            {priceRanges.map((range) => {
              const rangeMin = range.minPrice === bounds?.minPrice ? undefined : range.minPrice;
              const rangeMax = range.maxPrice === bounds?.maxPrice ? undefined : range.maxPrice;
              const checked = !priceDraft && values.minPrice === rangeMin && values.maxPrice === rangeMax;

              return (
                <label key={range.label} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setPriceDraft(null);
                      applyPriceRange(event.target.checked ? range : {});
                    }}
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                  />
                  <span>{range.label}</span>
                </label>
              );
            })}
          </fieldset>
        )}

        {(["minPrice", "maxPrice"] as const).map((field) => (
          <label key={field} className="space-y-1">
            <span className="block text-sm font-medium">{field === "minPrice" ? "Giá từ" : "Giá đến"}</span>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formatPriceInput(field === "minPrice" ? minPrice : maxPrice)}
                onChange={(event) => changePrice(field, event.target.value)}
                disabled={pricesDisabled}
                aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? priceErrorId : undefined}
                className="h-10 w-full rounded-md border border-input bg-background px-3 pr-8 text-right text-sm disabled:opacity-50"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">₫</span>
            </div>
          </label>
        ))}

        <label className="space-y-1">
          <span className="block text-sm font-medium">Sắp xếp</span>
          <select
            value={values.sort}
            onChange={(event) => onChange({ ...values, sort: event.target.value as ProductSort })}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value={ProductSort.NEWEST}>Mới nhất</option>
            <option value={ProductSort.PRICE_ASC}>Giá tăng dần</option>
            <option value={ProductSort.PRICE_DESC}>Giá giảm dần</option>
            <option value={ProductSort.RATING_DESC}>Đánh giá cao</option>
            <option value={ProductSort.NAME_ASC}>Tên A–Z</option>
          </select>
        </label>
      </div>

      {boundsQuery.isPending && <p role="status">Đang tải khoảng giá…</p>}
      {boundsQuery.isError && (
        <div role="alert" className="space-y-2">
          <p>Không tải được khoảng giá của danh mục.</p>
          <Button type="button" variant="outline" onClick={() => void boundsQuery.refetch()}>Thử lại</Button>
        </div>
      )}
      {boundsQuery.isSuccess && bounds === null && (
        <p className="text-sm text-muted-foreground">Danh mục chưa có sản phẩm để chọn khoảng giá.</p>
      )}
      {brandsQuery.isPending && <p role="status">Đang tải thương hiệu…</p>}
      {brandsQuery.isError && (
        <div role="alert" className="space-y-2">
          <p>Không tải được thương hiệu.</p>
          <Button type="button" variant="outline" onClick={() => void brandsQuery.refetch()}>Thử lại</Button>
        </div>
      )}
      {priceError && <p id={priceErrorId} role="alert" className="text-sm text-destructive">{priceError}</p>}
      <Button type="button" variant="outline" onClick={clearFilters}>Xóa lọc</Button>
    </div>
  );
}
