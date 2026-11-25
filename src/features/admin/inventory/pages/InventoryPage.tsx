import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { Pagination } from "@/shared/components/Pagination";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { isPositiveLongId } from "@/shared/types/common";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import {
  INVENTORY_PAGE_SIZES,
  inventoryStatusLabels,
  parseInventoryFilters,
  selectInventoryPage,
  serializeInventoryFilters,
  toInventoryParams,
  validateInventoryFilters,
  type InventoryFilters,
  type InventorySort,
} from "../filters";
import { isCurrentInventorySession, useAdminInventory, useInventorySession, type InventorySession } from "../queries";
import { AdjustStockDialog } from "../components/AdjustStockDialog";
import { InventoryHistoryDrawer } from "../components/InventoryHistoryDrawer";
import { inventoryStatuses, type InventoryResponse } from "../types";

const columns: readonly DataTableColumn<InventoryResponse, InventorySort>[] = [
  {
    id: "productName",
    header: "Sản phẩm",
    sortBy: "productName",
    cell: (item) => (
      <div className="max-w-80 wrap-anywhere">
        {isPositiveLongId(item.productId ?? undefined) ? (
          <Link
            className="font-semibold text-primary underline underline-offset-4"
            to={`/admin/products/${item.productId}/edit`}
          >
            {item.productName || "Sản phẩm không có tên"}
          </Link>
        ) : (
          <span>{item.productName || "Sản phẩm không còn tham chiếu"}</span>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Mã sản phẩm: {item.productId ?? "—"}
        </p>
      </div>
    ),
  },
  {
    id: "sku",
    header: "SKU / biến thể",
    sortBy: "sku",
    cell: (item) => (
      <div className="max-w-64 wrap-anywhere">
        <span className="font-mono">{item.sku || "Chưa có SKU"}</span>
        <p className="mt-1 text-xs text-muted-foreground">
          Mã biến thể: {item.variantId ?? "—"}
        </p>
      </div>
    ),
  },
  {
    id: "id",
    header: "Mã kho",
    cell: (item) => item.id,
  },
  {
    id: "quantity",
    header: "Tồn kho",
    sortBy: "quantity",
    cell: (item) => item.quantity?.toLocaleString("vi-VN") ?? "Chưa có dữ liệu",
  },
  {
    id: "status",
    header: "Trạng thái kho",
    align: "center",
    cell: (item) => (
      <StatusBadge
        caption="Tồn kho"
        label={inventoryStatusLabels[item.status] ?? "Không xác định"}
        tone={item.status === "IN_STOCK" ? "success" : item.status === "LOW_STOCK" ? "pending" : "danger"}
        icon={Package}
        compact
      />
    ),
  },
  {
    id: "updatedAt",
    header: "Cập nhật",
    sortBy: "updatedAt",
    cell: (item) => item.updatedAt ? formatDateTime(item.updatedAt) : "—",
  },
];
const fieldClassName = "h-10 min-w-0 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";

export function InventoryPage() {
  const session = useInventorySession();
  const [dialog, setDialog] = useState<{
    kind: "adjust" | "history";
    item: InventoryResponse;
    session: InventorySession;
  } | null>(null);
  const actionColumns: readonly DataTableColumn<InventoryResponse, InventorySort>[] = [
    ...columns,
    {
      id: "actions",
      header: "Thao tác",
      align: "center",
      cell: (item) => (
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            disabled={!isPositiveLongId(item.id) || !isCurrentInventorySession(session)}
            aria-label={`Điều chỉnh kho ${item.sku || item.id}`}
            onClick={() => {
              if (session) setDialog({ kind: "adjust", item, session });
            }}
          >
            Điều chỉnh
          </Button>
          <Button
            variant="outline"
            disabled={!isPositiveLongId(item.id) || !isCurrentInventorySession(session)}
            aria-label={`Lịch sử kho ${item.sku || item.id}`}
            onClick={() => {
              if (session) setDialog({ kind: "history", item, session });
            }}
          >
            Lịch sử
          </Button>
        </div>
      ),
    },
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseInventoryFilters(searchParams);
  const canonical = serializeInventoryFilters(filters).toString();
  const isCanonical = canonical === searchParams.toString();
  const validationError = validateInventoryFilters(filters);
  const query = useAdminInventory(toInventoryParams(filters), isCanonical && !validationError);
  const data = query.data ? selectInventoryPage(query.data, filters) : undefined;
  const page = data?.page;

  useEffect(() => {
    if (!isCanonical) setSearchParams(canonical, { replace: true });
  }, [isCanonical, canonical, setSearchParams]);

  useEffect(() => {
    if (!isCanonical || validationError || query.isFetching || query.isError || page === undefined || page === filters.page) {
      return;
    }
    setSearchParams(
      (current) => serializeInventoryFilters({ ...parseInventoryFilters(current), page }),
      { replace: true },
    );
  }, [isCanonical, validationError, query.isFetching, query.isError, page, filters.page, setSearchParams]);

  function changeFilters(patch: Partial<InventoryFilters>, replace = false) {
    setSearchParams(
      (current) => serializeInventoryFilters({ ...parseInventoryFilters(current), ...patch, page: 1 }),
      { replace },
    );
  }

  function changePage(nextPage: number) {
    setSearchParams((current) => serializeInventoryFilters({ ...parseInventoryFilters(current), page: nextPage }));
  }

  function changeSort(sortBy: InventorySort) {
    changeFilters({
      sortBy,
      direction: filters.sortBy === sortBy && filters.direction === "asc" ? "desc" : "asc",
    });
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="Quản lý tồn kho"
        description="Tra cứu tồn theo SKU, tên sản phẩm, trạng thái và khoảng số lượng."
      />

      <FilterBar>
        <label className="grid min-w-48 flex-1 gap-2 text-sm font-medium">
          SKU hoặc tên sản phẩm
          <input
            type="search"
            className={fieldClassName}
            value={filters.keyword}
            placeholder="Nhập SKU hoặc tên sản phẩm"
            onChange={(event) => changeFilters({ keyword: event.target.value }, true)}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Trạng thái
          <select
            className={fieldClassName}
            value={filters.status}
            onChange={(event) => changeFilters({
              status: inventoryStatuses.find((status) => status === event.target.value) ?? "",
            })}
          >
            <option value="">Tất cả</option>
            {inventoryStatuses.map((status) => (
              <option key={status} value={status}>{inventoryStatusLabels[status]}</option>
            ))}
          </select>
        </label>

        {(["minQuantity", "maxQuantity"] as const).map((key) => (
          <label key={key} className="grid gap-2 text-sm font-medium">
            {key === "minQuantity" ? "Tồn tối thiểu" : "Tồn tối đa"}
            <input
              type="text"
              inputMode="numeric"
              className={`${fieldClassName} w-36`}
              value={filters[key]}
              aria-invalid={Boolean(validationError)}
              aria-describedby={validationError ? "inventory-filter-error" : undefined}
              onChange={(event) => changeFilters({ [key]: event.target.value }, true)}
            />
          </label>
        ))}

        <label className="grid gap-2 text-sm font-medium">
          Số dòng
          <select
            className={fieldClassName}
            value={filters.size}
            onChange={(event) => changeFilters({
              size: INVENTORY_PAGE_SIZES.find((size) => String(size) === event.target.value) ?? 10,
            })}
          >
            {INVENTORY_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>

        <Button variant="outline" className="h-10 self-end px-4" onClick={() => setSearchParams({})}>
          Xóa bộ lọc
        </Button>
      </FilterBar>

      {validationError ? (
        <p id="inventory-filter-error" role="alert" className="text-destructive">
          {validationError}
        </p>
      ) : (
        <div className="space-y-4" aria-busy={query.isFetching}>
          {!isCanonical || query.isPending ? (
            <p role="status">Đang tải tồn kho…</p>
          ) : (
            <>
              {query.isError && (
                <div role="alert" className="space-y-2">
                  <p>{query.error.message}{data ? " Dữ liệu dưới đây có thể chưa mới nhất." : ""}</p>
                  <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
                    Thử lại
                  </Button>
                </div>
              )}
              {data && (
                <>
                  <p role="status" className="text-sm text-muted-foreground">
                    {query.isFetching ? "Đang cập nhật… " : ""}Tìm thấy {data.totalItems} bản ghi kho.
                  </p>
                  <DataTable
                    caption="Danh sách tồn kho"
                    columns={actionColumns}
                    rows={data.rows}
                    rowKey={(item) => item.id}
                    sortBy={filters.sortBy}
                    direction={filters.direction}
                    onSort={changeSort}
                    emptyMessage="Không có tồn kho phù hợp với bộ lọc."
                  />
                  <Pagination
                    ariaLabel="Phân trang tồn kho"
                    currentPage={data.page}
                    totalPages={data.totalPages}
                    isFetching={query.isFetching}
                    onPageChange={changePage}
                  />
                </>
              )}
            </>
          )}
        </div>
      )}

      {dialog && isCurrentInventorySession(dialog.session) && (
        dialog.kind === "adjust" ? (
          <AdjustStockDialog
            item={dialog.item}
            session={dialog.session}
            onClose={() => setDialog(null)}
            onHistory={() => setDialog({ ...dialog, kind: "history" })}
          />
        ) : (
          <InventoryHistoryDrawer
            item={dialog.item}
            session={dialog.session}
            onClose={() => setDialog(null)}
          />
        )
      )}
    </section>
  );
}
