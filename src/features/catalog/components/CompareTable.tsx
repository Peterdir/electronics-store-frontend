import { useState } from "react";
import { Link } from "react-router";
import { formatVND } from "@/lib/format";
import type { ProductCompareResponse } from "../types";

interface CompareTableProps {
  products: ProductCompareResponse[];
}

function CompareImage({
  src,
  name,
}: {
  src: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-32 w-32 items-center justify-center rounded bg-muted text-sm text-muted-foreground">
        Chưa có ảnh
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-32 w-32 rounded object-contain"
    />
  );
}

export function CompareTable({ products }: CompareTableProps) {
  const specificationKeys = [
    ...new Set(
      products.flatMap((product) =>
        Object.keys(product.specification ?? {}),
      ),
    ),
  ];

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[700px] border-collapse text-left text-sm">
        <caption className="sr-only">So sánh sản phẩm</caption>

        <thead>
          <tr className="border-b bg-muted/50">
            <th scope="col" className="min-w-40 p-4">
              Tiêu chí
            </th>

            {products.map((product) => (
              <th
                key={product.id}
                scope="col"
                className="min-w-48 border-l p-4 align-top"
              >
                <Link
                  to={`/products/${product.id}`}
                  className="space-y-3 hover:underline"
                >
                  <CompareImage src={product.imageUrl} name={product.name} />
                  <span className="block font-semibold">{product.name}</span>
                </Link>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr className="border-b">
            <th scope="row" className="p-4 font-medium">
              Giá
            </th>
            {products.map((product) => (
              <td key={product.id} className="border-l p-4">
                {formatVND(product.basePrice)}
              </td>
            ))}
          </tr>

          <tr className="border-b">
            <th scope="row" className="p-4 font-medium">
              Thương hiệu
            </th>
            {products.map((product) => (
              <td key={product.id} className="border-l p-4">
                {product.brandName || "—"}
              </td>
            ))}
          </tr>

          <tr className="border-b">
            <th scope="row" className="p-4 font-medium">
              Danh mục
            </th>
            {products.map((product) => (
              <td key={product.id} className="border-l p-4">
                {product.categoryName || "—"}
              </td>
            ))}
          </tr>

          {specificationKeys.map((key) => (
            <tr key={key} className="border-b last:border-b-0">
              <th scope="row" className="p-4 font-medium">
                {key}
              </th>
              {products.map((product) => {
                const value = product.specification?.[key];

                return (
                  <td key={product.id} className="border-l p-4">
                    {value === null || value === undefined || value === ""
                      ? "—"
                      : String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}