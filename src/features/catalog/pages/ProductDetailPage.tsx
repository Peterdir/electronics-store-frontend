import { useGetProductDetails } from "../queries"
import { Link, useParams } from "react-router";
import { ApiError } from "@/shared/api/errors";
import { ProductGallery } from "../components/ProductGallery";
import { SpecTable } from "../components/SpecTable";
import { formatVND } from "@/lib/format";


export function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const productId = id && /^[1-9]\d*$/.test(id) ? id : "";
    const detailQuery = useGetProductDetails(productId);

    if (!productId) {
        return <p>Đường dẫn sản phẩm không hợp lệ.</p>;
    }   

    if (detailQuery.isPending) {
        return <p role="status">Đang tải sản phẩm…</p>;
    }

    if (detailQuery.isError) {
        if (detailQuery.error instanceof ApiError && detailQuery.error.status === 404) {
            return <p>Không tìm thấy sản phẩm.</p>;
        }

        return (
            <div role="alert">
                <p>Không tải được sản phẩm.</p>
                <button type="button" onClick={() => void detailQuery.refetch()}>
                    Thử lại
                </button>
            </div>
        );
    }

    const product = detailQuery.data;

    return (
        <section className="space-y-8">
            <Link to="/products" className="inline-block text-sm text-primary hover:underline">
                Quay lại danh sách sản phẩm
            </Link>

            <div className="grid gap-8 lg:grid-cols-2">
                <ProductGallery
                    images={product.images ?? []}
                    name={product.name}
                />

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {[product.brandName, product.categoryName]
                            .filter(Boolean)
                            .join(" · ") || "Sản phẩm"}
                    </p>

                    <h1 className="text-3xl font-bold">
                        {product.name}
                    </h1>

                    {product.averageRating !== null && (
                        <p>Đánh giá trung bình: {product.averageRating.toFixed(1)}/5</p>
                    )}

                    <p className="text-2xl font-semibold text-primary">
                        {formatVND(product.basePrice)}
                    </p>

                    <div className="space-y-2 border-t pt-4">
                        <h2 className="text-lg font-semibold">Mô tả</h2>
                        <p className="whitespace-pre-line text-sm leading-6">
                            {product.description || "Chưa có mô tả."}
                        </p>
                    </div>
                </div>
            </div>

            <SpecTable specification={product.specification} />
        </section>
    )
}
