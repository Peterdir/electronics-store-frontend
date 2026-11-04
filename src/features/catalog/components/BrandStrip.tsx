import type { BrandResponse } from "@/features/catalog/types";
import { ActiveStatus } from "@/shared/types/enums";
import { DiscoveryTile } from "./DiscoveryTile";

export function BrandStrip({ brands }: { brands: BrandResponse[] }) {
  const activeBrands = brands.filter(
    (brand) => brand.status === ActiveStatus.ACTIVE,
  );

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-semibold tracking-tight">Thương hiệu nổi bật</h2>

      {activeBrands.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có thương hiệu để hiển thị.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {activeBrands.map((brand) => (
            <DiscoveryTile
              key={brand.id}
              name={brand.name}
              imageUrl={brand.logo}
              imageFit="contain"
              imageClassName="rounded-md bg-slate-100 p-2"
              to={`/products?brandId=${brand.id}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
