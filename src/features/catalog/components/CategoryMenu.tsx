import type { CategoryResponse } from "@/features/catalog/types";
import { ActiveStatus } from "@/shared/types/enums";
import { DiscoveryTile } from "./DiscoveryTile";

export function CategoryMenu({
  categories,
}: {
  categories: CategoryResponse[];
}) {
  const activeCategories = categories.filter(
    (category) => category.status === ActiveStatus.ACTIVE,
  );

  return (
    <section className="space-y-5 rounded-xl border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-semibold">Danh mục nổi bật</h2>

      {activeCategories.length === 0 ? (
        <p>Chưa có danh mục để hiển thị.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {activeCategories.map((category) => (
            <DiscoveryTile
              key={category.id}
              name={category.name}
              imageUrl={category.imageUrl}
              to={`/products?categoryId=${category.id}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
