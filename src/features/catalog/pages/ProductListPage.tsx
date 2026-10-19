import { useGetProducts } from "../queries";
import { ProductGrid } from "../components/ProductGrid";
import { useSearchParams } from "react-router";
import { Pagination } from "../components/Pagination";
import { useEffect } from "react";

export function ProductListPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const rawPage = searchParams.get("page");
    const parsedPage = rawPage === null ? 1 : Number(rawPage);
    const currentPage = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

    const productsQuery = useGetProducts({ page: currentPage - 1, size: 10 });

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

    if (productsQuery.isPending) {
        return <p role="status">Đang tải sản phẩm</p>
    }

    if (productsQuery.isError) {
        return (
            <section aria-live="polite">
                <p>Không tải được sản phẩm</p>
                <button type="button" onClick={() => void productsQuery.refetch()}>
                    Thử lại
                </button>
            </section>
        )
    }

    const products = productsQuery.data.items;

    return (
        <section className="space-y-6">
            <h1 className="text-2xl font-bold">Sản phẩm</h1>

            {productsQuery.isFetching && (
                <p role="status">Đang tải trang sản phẩm…</p>
            )}

            {products.length === 0 ? (
                <p>Chưa có sản phẩm phù hợp</p>
            ) : (
                <ProductGrid products={products} />
            )}

            <Pagination
                currentPage={currentPage}
                totalPages={productsQuery.data.totalPages}
                isFetching={productsQuery.isFetching}
                onPageChange={goToPage}
            />
        </section>
    )
}