import { useGetCategories, useGetProducts } from "../queries";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "../components/ProductGrid";
import { useSearchParams } from "react-router";
import { Pagination } from "../components/Pagination";
import { useEffect } from "react";
import { SearchBar } from "../components/SearchBar";
import { ActiveStatus, ProductSort } from "@/shared/types/enums";
import type { ID } from "@/shared/types/common";
import {
    ProductFilters,
    type ProductFilterValues,
} from "../components/ProductFilters";


const MAX_LONG_ID = 9_223_372_036_854_775_807n;

function parseId(value: string | null): ID | undefined {
    if (value === null || !/^\d+$/.test(value)) return undefined;

    const id = BigInt(value);
    if (id <= 0n || id > MAX_LONG_ID) return undefined;

    return value as ID;
}

function parseUrlPrice(value: string | null): number | undefined {
    if (value === null || value.trim() === "") return undefined;

    const price = Number(value);
    return Number.isSafeInteger(price) && 
        price >= 0
        ? price
        : undefined;
}

function parseSort(value: string | null): ProductSort {
    const allowedSorts = Object.values(ProductSort) as ProductSort[];

    return value && allowedSorts.includes(value as ProductSort)
        ? (value as ProductSort)
        : ProductSort.NEWEST;
}

export function ProductListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const categoriesQuery = useGetCategories();
    const categories = categoriesQuery.data?.filter(
        (category) => category.status === ActiveStatus.ACTIVE,
    ) ?? [];

    const keyword = (searchParams.get("q") ?? "").trim();
    const requestedCategoryId = parseId(searchParams.get("categoryId"));
    const categoryId = categories.find((category) => category.id === requestedCategoryId)?.id
        ?? categories[0]?.id;
    const hasSelectedCategory = categoryId !== undefined && requestedCategoryId === categoryId;
    const brandId = parseId(searchParams.get("brandId"));
    const minPrice = hasSelectedCategory ? parseUrlPrice(searchParams.get("minPrice")) : undefined;
    const maxPrice = hasSelectedCategory ? parseUrlPrice(searchParams.get("maxPrice")) : undefined;
    const sort = parseSort(searchParams.get("sort"));

    const rawPage = searchParams.get("page");
    const parsedPage = rawPage === null ? 1 : Number(rawPage);
    const currentPage = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

    const productsQuery = useGetProducts({
        keyword: keyword || undefined,
        categoryId,
        brandId,
        minPrice,
        maxPrice,
        sort,
        page: currentPage - 1, 
        size: 12
    }, categoriesQuery.isSuccess && hasSelectedCategory);

    useEffect(() => {
        if (!categoriesQuery.isSuccess || !categoryId || hasSelectedCategory) return;

        setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams);
            nextParams.set("categoryId", categoryId);
            nextParams.delete("minPrice");
            nextParams.delete("maxPrice");
            nextParams.set("page", "1");
            return nextParams;
        }, { replace: true });
    }, [categoriesQuery.isSuccess, categoryId, hasSelectedCategory, setSearchParams]);

    useEffect(() => {
        const totalPages = productsQuery.data?.totalPages;

        if (
            !hasSelectedCategory ||
            productsQuery.isError ||
            productsQuery.isPlaceholderData ||
            totalPages === undefined
        ) {
            return;
        }

        const lastPage = Math.max(totalPages, 1);
        const validPage = Math.min(currentPage, lastPage);

        if (rawPage === String(validPage)) return;

        setSearchParams(
            (currentParams) => {
                const nextParams = new URLSearchParams(currentParams);
                nextParams.set("page", String(validPage));
                return nextParams;
            },
            { replace: true },
        );
        }, [
            currentPage,
            hasSelectedCategory,
            productsQuery.data?.totalPages,
            productsQuery.isError,
            productsQuery.isPlaceholderData,
            rawPage,
            setSearchParams,
    ]);

    function goToPage(nextPage: number) {
        setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams);
            nextParams.set("page", String(nextPage));
            return nextParams;
        });
    }

    function searchProducts(nextKeyword: string) {
        setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams);
            const normalizedKeyword = nextKeyword.trim();

            if (normalizedKeyword) {
                nextParams.set("q", normalizedKeyword);
            } else {
                nextParams.delete("q");
            }

            nextParams.set("page", "1");
            return nextParams;
        });
    }

    function applyFilters(filters: ProductFilterValues, options?: { replace?: boolean }) {
        setSearchParams((currentParams) => {
            const nextParams = new URLSearchParams(currentParams);

            nextParams.set("categoryId", filters.categoryId);

            if (filters.brandId) {
                nextParams.set("brandId", filters.brandId);
            } else {
                nextParams.delete("brandId");
            }

            if (filters.minPrice !== undefined) {
                nextParams.set("minPrice", String(filters.minPrice));
            } else {
                nextParams.delete("minPrice");
            }

            if (filters.maxPrice !== undefined) {
                nextParams.set("maxPrice", String(filters.maxPrice));
            } else {
                nextParams.delete("maxPrice");
            }

            if (filters.sort === ProductSort.NEWEST) {
                nextParams.delete("sort");
            } else {
                nextParams.set("sort", filters.sort);
            }

            nextParams.set("page", "1");
            return nextParams;
        }, { replace: options?.replace ?? false });
    }

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-bold">Sản phẩm</h1>

            <div className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
                <aside className="self-start lg:sticky lg:top-6">
                    {categoriesQuery.isPending ? (
                        <p role="status">Đang tải danh mục…</p>
                    ) : categoriesQuery.isError ? (
                        <div role="alert" className="space-y-2">
                            <p>Không tải được danh mục.</p>
                            <Button type="button" variant="outline" onClick={() => void categoriesQuery.refetch()}>
                                Thử lại
                            </Button>
                        </div>
                    ) : categoryId ? (
                        <ProductFilters
                            key={categoryId}
                            values={{ categoryId, brandId, minPrice, maxPrice, sort }}
                            categories={categories}
                            onChange={applyFilters}
                        />
                    ) : (
                        <p>Chưa có danh mục đang hoạt động.</p>
                    )}
                </aside>

                <div className="min-w-0 space-y-6">
                    <SearchBar
                        key={keyword}
                        initialValue={keyword}
                        onSearch={searchProducts}
                    />

                    {categoriesQuery.isError ? (
                        <p>Vui lòng tải lại danh mục để xem sản phẩm.</p>
                    ) : categoriesQuery.isSuccess && !categoryId ? (
                        <p>Chưa có sản phẩm để hiển thị.</p>
                    ) : !hasSelectedCategory || productsQuery.isPending ? (
                        <p role="status">Đang tải sản phẩm…</p>
                    ) : productsQuery.isError ? (
                        <div aria-live="polite">
                            <p>Không tải được sản phẩm</p>
                            <button
                                type="button"
                                onClick={() => void productsQuery.refetch()}
                            >
                                Thử lại
                            </button>
                        </div>
                    ) : (
                        <>
                            {productsQuery.isFetching && (
                                <p role="status">Đang tải trang sản phẩm…</p>
                            )}

                            {productsQuery.data.items.length === 0 ? (
                                <p>Chưa có sản phẩm phù hợp</p>
                            ) : (
                                <ProductGrid products={productsQuery.data.items} />
                            )}

                            <Pagination
                                currentPage={currentPage}
                                totalPages={productsQuery.data.totalPages}
                                isFetching={productsQuery.isFetching}
                                onPageChange={goToPage}
                            />
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}
