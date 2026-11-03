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
import { ArrowRight } from "lucide-react";
import { HeroShowcase } from "../components/HeroShowcase";

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
      <section className="relative isolate overflow-hidden rounded-3xl border border-border bg-card">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at 85% 35%, rgb(34 211 238 / 14%), transparent 45%), " +
              "radial-gradient(ellipse at 100% 100%, rgb(139 92 246 / 14%), transparent 45%)",
          }}
        />

        <div className="grid items-center gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[3fr_2fr] lg:px-14">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold tracking-widest text-primary uppercase">
              Electronics Store
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Khám phá thiết bị công nghệ
            </h1>

            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              Tìm thiết bị theo thương hiệu, xem thông số và so sánh các sản phẩm
              bạn đang cân nhắc.
            </p>

            <Link
              to="/products"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Xem tất cả sản phẩm
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <HeroShowcase />
        </div>
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