import { Link, useSearchParams } from "react-router";
import { ApiError } from "@/shared/api/errors";
import type { ID } from "@/shared/types/common";
import { CompareTable } from "../components/CompareTable";
import { useGetProductCompare } from "../queries";

const MAX_LONG_ID = 9_223_372_036_854_775_807n;

function isValidId(value: string): boolean {
  return (
    /^[1-9]\d*$/.test(value) &&
    BigInt(value) <= MAX_LONG_ID
  );
}

function parseIds(raw: string | null) {
  const requested = [
    ...new Set(
      (raw ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];

  const valid = requested.filter(isValidId);
  const ids = valid.slice(0, 4) as ID[];
  const ignored = requested.filter(
    (value) => !isValidId(value) || !ids.includes(value),
  );

  return { ids, ignored };
}

export function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { ids, ignored } = parseIds(searchParams.get("ids"));
  const compareQuery = useGetProductCompare(ids);

  function changeIds(nextIds: ID[]) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (nextIds.length > 0) {
        next.set("ids", nextIds.join(","));
      } else {
        next.delete("ids");
      }

      return next;
    });
  }

  const response = compareQuery.data ?? [];
  const byId = new Map(response.map((product) => [product.id, product]));
  const products = ids.flatMap((id) => {
    const product = byId.get(id);
    return product ? [product] : [];
  });
  const missingIds = compareQuery.isSuccess
    ? ids.filter((id) => !byId.has(id))
    : [];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <Link to="/products" className="text-sm text-primary hover:underline">
          ← Chọn thêm sản phẩm
        </Link>
        <h1 className="text-3xl font-bold">So sánh sản phẩm</h1>
      </div>

      {ignored.length > 0 && (
        <div role="alert" className="rounded-lg border p-4">
          <p>
            Đã bỏ qua ID không hợp lệ hoặc vượt giới hạn 4 sản phẩm:{" "}
            {ignored.join(", ")}.
          </p>
          <button
            type="button"
            onClick={() => changeIds(ids)}
            className="mt-2 underline"
          >
            Làm sạch URL
          </button>
        </div>
      )}

      {ids.length > 0 && (
        <div aria-label="Sản phẩm đang so sánh" className="flex flex-wrap gap-2">
          {ids.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => changeIds(ids.filter((item) => item !== id))}
              className="rounded border px-3 py-2 text-sm"
              aria-label={`Bỏ sản phẩm ${id} khỏi trang so sánh`}
            >
              Sản phẩm #{id} ×
            </button>
          ))}
        </div>
      )}

      {ids.length < 2 ? (
        <p>Chọn ít nhất 2 sản phẩm để so sánh.</p>
      ) : compareQuery.isPending ? (
        <p role="status">Đang tải bảng so sánh…</p>
      ) : compareQuery.isError ? (
        <div role="alert" className="space-y-2">
          <p>
            {compareQuery.error instanceof ApiError &&
            compareQuery.error.status === 404
              ? "Có sản phẩm không còn tồn tại. Hãy bỏ từng ID ở trên rồi thử lại."
              : "Không tải được bảng so sánh."}
          </p>
          <button
            type="button"
            onClick={() => void compareQuery.refetch()}
            className="underline"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {missingIds.length > 0 && (
            <p role="status">
              Không tìm thấy sản phẩm: {missingIds.join(", ")}. Bạn có thể bỏ
              các ID đó ở trên.
            </p>
          )}

          {products.length > 0 ? (
            <CompareTable products={products} />
          ) : (
            <p>Không có sản phẩm nào để hiển thị.</p>
          )}
        </>
      )}
    </section>
  );
}