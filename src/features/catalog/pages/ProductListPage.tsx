import { useGetProducts } from "../queries";
import { ProductGrid } from "../components/ProductGrid";
import { useSearchParams } from "react-router";
import { Pagination } from "../components/Pagination";
import { useEffect } from "react";
import { SearchBar } from "../components/SearchBar";
import { ProductSort } from "@/shared/types/enums";
import type { ID } from "@/shared/types/common";


const MAX_LONG_ID = 9_223_372_036_854_775_807n;

function parseId(value: string | null): ID | undefined {
    if (value === null || !/^\d+$/.test(value)) return undefined;

    const id = BigInt(value);
    if (id <= 0n || id > MAX_LONG_ID) return undefined;

    return value as ID;
}

function parsePrice(value: string | null): number | undefined {
    if (value === null || value.trim() === "") return undefined;

    const price = Number(value);
    return Number.isFinite(price) && price >= 0 ? price : undefined;
}

function parseSort(value: string | null): ProductSort {
    const allowedSorts = Object.values(ProductSort) as ProductSort[];

    return value && allowedSorts.includes(value as ProductSort)
        ? (value as ProductSort)
        : ProductSort.NEWEST;
}

export function ProductListPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    
    const keyword = (searchParams.get("q") ?? "").trim();
    const categoryId = parseId(searchParams.get("categoryId"));
    const brandId = parseId(searchParams.get("brandId"));
    const minPrice = parsePrice(searchParams.get("minPrice"));
    const maxPrice = parsePrice(searchParams.get("maxPrice"));
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
    });

    useEffect(() => {
        const totalPages = productsQuery.data?.totalPages;

        if (
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

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-bold">Sản phẩm</h1>

            <SearchBar 
                key={keyword} 
                initialValue={keyword} 
                onSearch={searchProducts}
            />

            {productsQuery.isPending ? (
                <p role="status">Đang tải sản phẩm…</p>
            ) : productsQuery.isError ? (
                <div aria-live="polite">
                    <p>Không tải được sản phẩm</p>
                    
                    <button type="button" onClick={() => void productsQuery.refetch()}>
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
        </section>
    )
}