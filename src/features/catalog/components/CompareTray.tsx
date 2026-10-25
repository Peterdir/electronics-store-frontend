import { Link } from "react-router";
import { useCompare } from "../compare.store";

export function CompareTray() {
  const ids = useCompare((state) => state.compareIds);
  const remove = useCompare((state) => state.remove);
  const clear = useCompare((state) => state.clear);

  if (ids.length === 0) return null;

  return (
    <section
      aria-label="Danh sách so sánh"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background shadow-lg"
    >
      <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">So sánh ({ids.length}/4)</h2>

          <button type="button" onClick={clear} className="text-sm underline">
            Xóa tất cả
          </button>
        </div>

        <ul className="flex flex-wrap gap-2">
          {ids.map((id) => (
            <li key={id} className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Link to={`/products/${id}`} className="text-sm underline">
                Sản phẩm #{id}
              </Link>

              <button
                type="button"
                onClick={() => remove(id)}
                aria-label={`Bỏ sản phẩm ${id} khỏi danh sách so sánh`}
                className="text-sm"
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        {ids.length >= 2 ? (
          <Link
            to={`/compare?ids=${ids.join(",")}`}
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Xem so sánh
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chọn thêm 1 sản phẩm để so sánh.
          </p>
        )}
      </div>
    </section>
  );
}