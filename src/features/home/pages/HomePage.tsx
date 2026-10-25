import { Link } from "react-router";
import {
  useGetBrands,
  useGetCategories,
  useGetProducts,
} from "@/features/catalog/queries";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import { ProductSort } from "@/shared/types/enums";
import { CategoryMenu } from "@/features/catalog/components/CategoryMenu";
import { BrandStrip } from "@/features/catalog/components/BrandStrip";

export function HomePage() {
  const categoryQuery = useGetCategories();
  const brandQuery = useGetBrands();
  const productsQuery = useGetProducts({
    page: 0,
    size: 8,
    sort: ProductSort.NEWEST,
  });

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-primary px-6 py-12 text-primary-foreground sm:px-10">
        <h1 className="text-3xl font-bold">Khám phá đồ công nghệ</h1>
        <p className="mt-3">Tìm sản phẩm phù hợp với bạn.</p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-md bg-background px-4 py-2 font-medium text-foreground"
        >
          Xem tất cả sản phẩm
        </Link>
      </section>

      {categoryQuery.isPending ? (
        <p role="status">Đang tải danh mục…</p>
      ) : categoryQuery.isError ? (
        <div role="alert">
          <p>Không tải được danh mục.</p>
          <button type="button" onClick={() => void categoryQuery.refetch()}>
            Thử lại
          </button>
        </div>
      ) : (
        <CategoryMenu categories={categoryQuery.data} />
      )}

      {brandQuery.isPending ? (
        <p role="status">Đang tải thương hiệu…</p>
      ) : brandQuery.isError ? (
        <div role="alert">
          <p>Không tải được thương hiệu.</p>
          <button type="button" onClick={() => void brandQuery.refetch()}>
            Thử lại
          </button>
        </div>
      ) : (
        <BrandStrip brands={brandQuery.data} />
      )}

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Sản phẩm mới</h2>
          <Link to="/products?sort=NEWEST" className="text-primary underline">
            Xem tất cả
          </Link>
        </div>

        {productsQuery.isPending ? (
          <p role="status">Đang tải sản phẩm…</p>
        ) : productsQuery.isError ? (
          <div role="alert">
            <p>Không tải được sản phẩm.</p>
            <button type="button" onClick={() => void productsQuery.refetch()}>
              Thử lại
            </button>
          </div>
        ) : productsQuery.data.items.length === 0 ? (
          <p>Chưa có sản phẩm mới.</p>
        ) : (
          <ProductGrid products={productsQuery.data.items} />
        )}
      </section>
    </div>
  );
}