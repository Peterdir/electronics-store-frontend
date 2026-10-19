import { useGetProducts } from "../queries";
import { ProductGrid } from "../components/ProductGrid";

export function ProductListPage() {
    const productsQuery = useGetProducts({ page: 0, size: 10 });

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

            {products.length === 0 ? (
                <p>Chưa có sản phẩm phù hợp</p>
            ) : (
                <ProductGrid products={products} />
            )}
        </section>
    )
}