import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { Pagination } from "@/shared/components/Pagination";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { parseReturnFilters, RETURN_PAGE_SIZES, serializeReturnFilters } from "../filters";
import { useAdminReturns, useReturnsSession, type ReturnsSession } from "../queries";
import { returnStatusLabels, type AdminReturnRequest, type ReturnFilters } from "../types";
import { ReturnRequestDrawer } from "../components/ReturnRequestDrawer";

export function ReturnRequestsPage() {
  const snapshot = useReturnsSession();
  if (!snapshot) return <p role="alert">Vui lòng đăng nhập lại.</p>;
  return (
    <ReturnRequestsContent
      key={`${snapshot.userId}:${snapshot.role}:${snapshot.token}`}
      snapshot={snapshot}
    />
  );
}

function ReturnRequestsContent({ snapshot }: { snapshot: ReturnsSession }) {
  const [search, setSearch] = useSearchParams();
  const filters = parseReturnFilters(search);
  const canonicalSearch = serializeReturnFilters(filters).toString();
  const query = useAdminReturns(filters, snapshot);
  const [selected, setSelected] = useState<AdminReturnRequest | null>(null);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(() => new Set());
  const [processed, setProcessed] = useState<Record<string, AdminReturnRequest>>({});

  useEffect(() => {
    if (search.toString() !== canonicalSearch) setSearch(canonicalSearch, { replace: true });
  }, [search, canonicalSearch, setSearch]);

  useEffect(() => {
    if (query.data && !query.isFetching && !query.isError && filters.page > Math.max(1, query.data.totalPages)) {
      setSearch(serializeReturnFilters({ status: filters.status, size: filters.size, page: Math.max(1, query.data.totalPages) }), { replace: true });
    }
  }, [query.data, query.isFetching, query.isError, filters.page, filters.status, filters.size, setSearch]);

  function changeFilters(patch: Partial<ReturnFilters>) {
    setSelected(null);
    setSearch(serializeReturnFilters({ ...filters, ...patch }));
  }

  const columns: DataTableColumn<AdminReturnRequest, never>[] = [
    { id: "id", header: "Yêu cầu", cell: (row) => <span className="font-medium">#{row.id}</span> },
    {
      id: "order",
      header: "Đơn / dòng hàng",
      cell: (row) => (
        <div>
          <Link to={`/admin/orders/${row.orderId}`} className="text-primary underline">
            #{row.orderId}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Dòng #{row.orderItemId}</p>
        </div>
      ),
    },
    {
      id: "reason",
      header: "Lý do",
      align: "left",
      cell: (row) => <p className="max-w-xs whitespace-pre-wrap wrap-anywhere">{row.reason}</p>,
    },
    { id: "quantity", header: "Số lượng", cell: (row) => row.quantity },
    {
      id: "status",
      header: "Trạng thái",
      cell: (row) => (
        <StatusBadge
          compact
          caption="Yêu cầu trả hàng"
          label={returnStatusLabels[row.status]}
          tone={row.status === "PENDING" ? "pending" : row.status === "APPROVED" ? "success" : "danger"}
          icon={ClipboardCheck}
        />
      ),
    },
    { id: "createdAt", header: "Ngày tạo", cell: (row) => formatDateTime(row.createdAt) },
    {
      id: "actions",
      header: "Chi tiết",
      cell: (row) => (
        <Button variant="outline" onClick={() => setSelected(row)}>
          Xem yêu cầu #{row.id}
        </Button>
      ),
    },
  ];
  const selectedRow = selected
    ? processed[selected.id] ?? query.data?.items.find((row) => row.id === selected.id) ?? selected
    : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Yêu cầu trả hàng"
        actions={
          <Button variant="outline" disabled={query.isFetching} onClick={() => { void query.refetch(); }}>
            Tải lại danh sách
          </Button>
        }
      />
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
        <label className="space-y-2 text-sm">
          <span className="block font-medium">Trạng thái</span>
          <select
            value={filters.status}
            onChange={(event) => {
              const next = parseReturnFilters(new URLSearchParams({ status: event.target.value }));
              changeFilters({ status: next.status, page: 1 });
            }}
            className="rounded-lg border border-input bg-background p-2"
          >
            {Object.entries(returnStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="block font-medium">Số dòng mỗi trang</span>
          <select
            value={filters.size}
            onChange={(event) => changeFilters({ size: Number(event.target.value), page: 1 })}
            className="rounded-lg border border-input bg-background p-2"
          >
            {RETURN_PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
      {query.isPending && <p role="status">Đang tải yêu cầu trả hàng…</p>}
      {query.isError && (
        <p role="alert" className="text-sm text-destructive">
          {query.error.message} {query.data ? "Đang hiển thị dữ liệu cũ. " : ""}Hãy tải lại danh sách.
        </p>
      )}
      {query.data && (
        <>
          <p className="text-sm text-muted-foreground">{query.data.totalItems} yêu cầu • Trang {filters.page}</p>
          <DataTable
            caption="Danh sách yêu cầu trả hàng"
            rows={query.data.items}
            columns={columns}
            rowKey={(row) => row.id}
            emptyMessage="Không có yêu cầu ở trạng thái này."
          />
          <Pagination
            currentPage={filters.page}
            totalPages={query.data.totalPages}
            isFetching={query.isFetching}
            onPageChange={(page) => changeFilters({ page })}
          />
        </>
      )}
      {selectedRow && (
        <ReturnRequestDrawer
          key={selectedRow.id}
          request={selectedRow}
          snapshot={snapshot}
          blocked={blockedIds.has(selectedRow.id)}
          onBlocked={() => setBlockedIds((current) => new Set([...current, selectedRow.id]))}
          onSaved={(result) => {
            setSelected(result);
            setProcessed((current) => ({ ...current, [result.id]: result }));
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
