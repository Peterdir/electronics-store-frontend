import type { ProductResponse } from "../types";
import { formatVND } from "@/lib/format";
import { useState } from "react";
import { Link } from "react-router";
import { CompareToggleButton } from "./CompareToggleButton";

interface ProductCardProps {
  product: ProductResponse;
}

export function ProductCard({ product }: ProductCardProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = product.primaryImageUrl;
    const detailUrl = `/products/${product.id}`;

    return (
        <article className="product-card flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors duration-150 hover:border-primary/50 focus-within:border-primary/60">
            <div className="aspect-square w-full overflow-hidden bg-muted">
                <Link
                    to={detailUrl}
                    aria-label={`Xem chi tiết ${product.name}`}
                    className="block h-full w-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                {imageUrl && !imageFailed ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        onError={() => setImageFailed(true)}
                        className="product-card-image h-full w-full object-contain p-3"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
                        Chưa có ảnh
                    </div>
                )}
                </Link>
            </div>

            <div className="flex flex-1 flex-col items-start gap-2 p-4">
                <p className="text-xs text-muted-foreground">
                    {product.brandName ?? product.categoryName}
                </p>

                <Link to={detailUrl} className="line-clamp-2 min-h-12 wrap-anywhere font-medium leading-6 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">
                    {product.name}
                </Link>

                <p className="mt-auto pt-2 text-lg font-semibold tabular-nums text-primary">
                    {formatVND(product.basePrice)}
                </p>

                <CompareToggleButton id={product.id} name={product.name} />
            </div>
        </article>
    )
}