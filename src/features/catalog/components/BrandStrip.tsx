import type { BrandResponse } from "@/features/catalog/types";
import { ActiveStatus } from "@/shared/types/enums";
import { DiscoveryTile } from "./DiscoveryTile";

export function BrandStrip({ brands }: { brands: BrandResponse[] }) {
  const activeBrands = brands.filter(
    (brand) => brand.status === ActiveStatus.ACTIVE,
  );

  return (
    <section className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Thương hiệu nổi bật</h2>

      {activeBrands.length === 0 ? (
        <p>Chưa có thương hiệu để hiển thị.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {activeBrands.map((brand) => (
            <DiscoveryTile
              key={brand.id}
              name={brand.name}
              imageUrl={brand.logo}
              imageFit="contain"
              to={`/products?brandId=${brand.id}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
