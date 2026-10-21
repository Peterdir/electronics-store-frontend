import type { ID } from "@/shared/types/common";
import { ActiveStatus, ProductSort } from "@/shared/types/enums";
import { useGetBrands, useGetCategories } from "../queries";
import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";


export interface ProductFilterValues {
  categoryId?: ID;
  brandId?: ID;
  minPrice?: number;
  maxPrice?: number;
  sort: ProductSort;
}

interface ProductFiltersProps {
  initialValues: ProductFilterValues;
  onApply: (values: ProductFilterValues) => void;
}

function parsePriceInput(value: string): number | undefined | null {
  if (value.trim() === "") return undefined;

  const thousands = Number(value);
  const priceInVnd = thousands * 1000;

  return Number.isSafeInteger(thousands) &&
        thousands >= 0 &&
        Number.isSafeInteger(priceInVnd)
        ? priceInVnd
        : null;
}

function formatPriceInput(value: string): string {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function ProductFilters({
  initialValues,
  onApply,
}: ProductFiltersProps) {
    const categoriesQuery = useGetCategories();
    const brandsQuery = useGetBrands();

    const [categoryId, setCategoryId] = useState(initialValues.categoryId ?? "",);
    const [brandId, setBrandId] = useState(initialValues.brandId ?? "");
    const [minPrice, setMinPrice] = useState(
        initialValues.minPrice === undefined
            ? ""
            : String(initialValues.minPrice / 1000),
    );
    const [maxPrice, setMaxPrice] = useState(
        initialValues.maxPrice === undefined
            ? ""
            : String(initialValues.maxPrice / 1000),
    )
    const [sort, setSort] = useState<ProductSort>(initialValues.sort);
    const [error, setError] = useState<string | null>(null);

    const categories = categoriesQuery.data?.
        filter((category) => category.status === ActiveStatus.ACTIVE,
        ) ?? [];
    
    const brands = brandsQuery.data?.
        filter((brand) => brand.status === ActiveStatus.ACTIVE,
        ) ?? [];

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const parsedMinPrice = parsePriceInput(minPrice);
        const parsedMaxPrice = parsePriceInput(maxPrice);

        if (parsedMinPrice === null || parsedMaxPrice === null) {
            setError("Giá phải là số nguyên không âm")
            return;
        }

        if (parsedMinPrice !== undefined && 
            parsedMaxPrice !== undefined &&
            parsedMinPrice > parsedMaxPrice
        ) {
            setError("Giá tối thiểu không được lớn hơn giá tối đa")
            return;
        }

        setError(null);

        onApply({
            categoryId: categoryId || undefined,
            brandId: brandId || undefined,
            minPrice: parsedMinPrice,
            maxPrice: parsedMaxPrice,
            sort,
        });
    }

    function clearFilters() {
        setCategoryId("");
        setBrandId("");
        setMinPrice("");
        setMaxPrice("");
        setSort(ProductSort.NEWEST);
        setError(null);

        onApply({ sort: ProductSort.NEWEST });
    }

    return (
        <form
            noValidate
            onSubmit={handleSubmit}
            className="space-y-4 rounded-md border p-4"
        >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <label className="space-y-1">
                    <span className="block text-sm font-medium">
                        Danh mục
                    </span>

                    <select
                        value={categoryId}
                        onChange={(event) => setCategoryId(event.target.value)}
                        disabled={categoriesQuery.isPending || categoriesQuery.isError}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="">Tất cả danh mục</option>

                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="space-y-1">
                    <span className="block text-sm ">
                        Thương hiệu
                    </span>

                    <select
                        value={brandId}
                        onChange={(event) => setBrandId(event.target.value)}
                        disabled={brandsQuery.isPending || brandsQuery.isError}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="">
                            Tất cả thương hiệu
                        </option>

                        {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                                {brand.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="space-y-1">
                    <span className="text-sm font-medium">
                        Giá từ
                    </span>

                    <div className="relative">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatPriceInput(minPrice)}
                            onChange={(event) => {
                                const rawValue = event.target.value.replace(/\./g, "");

                                if (/^\d*$/.test(rawValue)) {
                                    setMinPrice(rawValue);
                                }

                                setError(null);
                            }}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 pr-13.25 text-right text-sm"
                        />

                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                            .000 ₫
                        </span>
                    </div>
                </label>

                <label className="space-y-1">
                    <span className="block text-sm font-medium">
                        Giá đến
                    </span>

                    <div className="relative">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatPriceInput(maxPrice)}
                            onChange={(event) => {
                                const rawValue = event.target.value.replace(/\./g, "");

                                if (/^\d*$/.test(rawValue)) {
                                    setMaxPrice(rawValue);
                                }

                                setError(null);
                            }}
                            className="h-10 w-full rounded-md border border-input bg-background px-3 pr-13.25 text-right text-sm"
                        />

                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                            .000 ₫
                        </span>
                    </div>    
                </label>

                <label className="space-y-1">
                    <span className="text-sm font-medium">Sắp xếp</span>
                    <select
                        value={sort}
                        onChange={(event) =>
                            setSort(event.target.value as ProductSort)
                        }
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

            {categoriesQuery.isPending && (
                <p role="status">Đang tải danh mục…</p>
            )}

            {categoriesQuery.isError && (
                <div role="alert" className="flex items-center gap-2">
                    <span>
                        Không tải được danh mục.
                    </span>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void categoriesQuery.refetch()}
                    >
                        Thử lại
                    </Button>
                </div>
            )}

            {brandsQuery.isPending && (
                <p role="status">Đang tải thương hiệu…</p>
            )}

            {brandsQuery.isError && (
                <div role="alert" className="flex items-center gap-2">
                    <span>
                        Không tải được thương hiệu.
                    </span>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void brandsQuery.refetch()}
                    >
                        Thử lại
                    </Button>
                </div>
            )}


            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}

            <div className="flex gap-2">
                <Button type="submit">Áp dụng</Button>
                <Button type="button" variant="outline" onClick={clearFilters}>
                    Xóa lọc
                </Button>
            </div>
        </form>
    )
}