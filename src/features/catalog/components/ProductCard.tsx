import type { ProductResponse } from "../types";
import { formatVND } from "@/lib/format";
import { useState } from "react";
import { Link } from "react-router";

interface ProductCardProps {
  product: ProductResponse;
}

export function ProductCard({ product }: ProductCardProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = product.primaryImageUrl;
    const detailUrl = `/products/${product.id}`;

    return (
        <article className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="aspect-square w-full">
                <Link
                    to={detailUrl}
                    aria-label={`Xem chi tiết ${product.name}`}
                    className="block aspect-square w-full"
                >
                {imageUrl && !imageFailed ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        onError={() => setImageFailed(true)}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
                        Chưa có ảnh
                    </div>
                )}
                </Link>
            </div>

            <div className="space-y-2 p-4">
                <p className="text-xs text-muted-foreground">
                    {product.brandName ?? product.categoryName}
                </p>

                <Link to={detailUrl} className="font-medium">
                    {product.name}
                </Link>

                <p className="font-semibold text-primary">
                    {formatVND(product.basePrice)}
                </p>
            </div>
        </article>
    )
}