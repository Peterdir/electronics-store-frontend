import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime, formatVND } from "@/lib/format";
import { OrderStatusBadge, PaymentStatusBadge } from "@/features/orders/components/OrderStatusBadges";
import { orderStatusLabels, paymentStatusLabels } from "@/features/orders/orderStatus";
import { Pagination } from "@/shared/components/Pagination";
import { OrderStatus, PaymentStatus } from "@/shared/types/enums";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import {
  ADMIN_ORDER_PAGE_SIZES,
  parseAdminOrdersFilters,
  serializeAdminOrdersFilters,
  toAdminOrdersParams,
} from "../filters";
import { useAdminOrders } from "../queries";
import type { AdminOrdersFilters, AdminOrderSortBy, OrderListAdminResponse } from "../types";

const columns: readonly DataTableColumn<OrderListAdminResponse, AdminOrderSortBy>[] = [
  {
    id: "id",
    header: "Mã đơn",
    cell: (order) => (<Link to={`/admin/orders/${order.id}`} className="font-semibold text-primary underline underline-offset-4">
      <span className="sr-only">Xem chi tiết đơn </span>#{order.id}
    </Link>),
  },
  {
    id: "customer",
    header: "Khách hàng",
    cell: (order) => (<div className="max-w-64 wrap-anywhere">
      <p className="font-medium">{order.customerName || "Chưa có tên"}</p>
      <p className="mt-1 text-xs text-muted-foreground">{order.customerEmail || "Không có email"}</p>
    </div>),
  },
  {
    id: "totalPrice",
    header: "Tổng tiền",
    sortBy: "totalPrice",
    cell: (order) => <span className="whitespace-nowrap">{formatVND(order.totalPrice)}</span>,
  },
  {
    id: "orderDate",
    header: "Ngày đặt",
    sortBy: "createdAt",
    cell: (order) => formatDateTime(order.orderDate),
  },
  {
    id: "orderStatus",
    header: "Trạng thái đơn hàng",
    align: "center",
    cell: (order) => (
      <OrderStatusBadge status={order.orderStatus} compact />
    ),
  },
  {
    id: "paymentStatus",
    header: "Thanh toán",
    align: "center",
    cell: (order) => (
      <PaymentStatusBadge status={order.paymentStatus} compact />
    ),
  },
];

const fieldClassName = "h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";

export function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseAdminOrdersFilters(searchParams);
  const normalizedSearch = serializeAdminOrdersFilters(filters).toString();
  const isCanonical = normalizedSearch === searchParams.toString();
  const debouncedKeyword = useDebounce(filters.keyword, 350);
  const isDebouncing = filters.keyword !== debouncedKeyword;

  useEffect(() => {
    if (!isCanonical) setSearchParams(normalizedSearch, { replace: true });
  }, [isCanonical, normalizedSearch, setSearchParams]);

  const query = useAdminOrders(toAdminOrdersParams(filters), isCanonical && !isDebouncing);
  const data = query.data;
  const lastPage = data ? Math.max(1, data.totalPages) : undefined;

  useEffect(() => {
    if (
      !isCanonical ||
      isDebouncing ||
      query.isFetching ||
      query.isError ||
      lastPage === undefined ||
      filters.page <= lastPage
    ) return;

    setSearchParams((current) => {
      const next = parseAdminOrdersFilters(current);
      return serializeAdminOrdersFilters({ ...next, page: lastPage });
    }, { replace: true });
  }, [isCanonical, isDebouncing, query.isFetching, query.isError, lastPage, filters.page, setSearchParams]);

  function changeFilters(patch: Partial<Omit<AdminOrdersFilters, "page">>, replace = false) {
    setSearchParams((current) => serializeAdminOrdersFilters({
      ...parseAdminOrdersFilters(current),
      ...patch,
      page: 1,
    }), { replace });
  }

  function changePage(page: number) {
    setSearchParams((current) => serializeAdminOrdersFilters({ ...parseAdminOrdersFilters(current), page }));
  }

  function changeSort(sortBy: AdminOrderSortBy) {
    changeFilters({
      sortBy,
      direction: filters.sortBy === sortBy && filters.direction === "asc" ? "desc" : "asc",
    });
  }

  const correctingPage = !query.isError && lastPage !== undefined && filters.page > lastPage;
  const waiting = !isCanonical || isDebouncing || query.isPending || correctingPage;

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="Quản lý đơn hàng"
        description="Tìm đơn theo mã, tên khách/người nhận hoặc số điện thoại người nhận."
      />
      <FilterBar>
        <label className="grid min-w-56 flex-1 gap-2 text-sm font-medium">
          Tìm kiếm đơn hàng
          <input
            type="search"
            className={fieldClassName}
            value={filters.keyword}
            placeholder="Mã đơn, tên hoặc số điện thoại"
            onChange={(event) => changeFilters({ keyword: event.target.value }, true)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Trạng thái đơn
          <select
            className={fieldClassName}
            value={filters.orderStatus ?? ""}
            onChange={(event) => changeFilters({
              orderStatus: Object.values(OrderStatus).find((value) => value === event.target.value),
            })}
          >
            <option value="">Tất cả trạng thái đơn</option>
            {Object.values(OrderStatus).map((status) => (
              <option key={status} value={status}>{orderStatusLabels[status]}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Thanh toán
          <select
            className={fieldClassName}
            value={filters.paymentStatus ?? ""}
            onChange={(event) => changeFilters({
              paymentStatus: Object.values(PaymentStatus).find((value) => value === event.target.value),
            })}
          >
            <option value="">Tất cả thanh toán</option>
            {Object.values(PaymentStatus).map((status) => (
              <option key={status} value={status}>{paymentStatusLabels[status]}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Số dòng
          <select
            className={fieldClassName}
            value={filters.size}
            onChange={(event) => changeFilters({ size: Number(event.target.value) })}
          >
            {ADMIN_ORDER_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>{size} / trang</option>
            ))}
          </select>
        </label>
        <Button
          variant="outline"
          type="button"
          className="h-10"
          onClick={() => setSearchParams(serializeAdminOrdersFilters(
            parseAdminOrdersFilters(new URLSearchParams()),
          ))}
        >
          Xóa bộ lọc
        </Button>
      </FilterBar>

      <div aria-busy={waiting || query.isFetching} className="space-y-4">
        {waiting ? <p role="status">{isDebouncing ? "Đang chờ bạn nhập xong…" : "Đang tải đơn hàng…"}</p> : !data ? (
          <div role="alert" className="space-y-3">
            <p>{query.error?.message || "Không tải được danh sách đơn hàng."}</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Thử lại</Button>
              {filters.page > 1 && <Button variant="outline" onClick={() => changePage(1)}>Về trang đầu</Button>}
            </div>
          </div>
        ) : (
          <>
            {query.isError && (
              <div role="alert" className="space-y-2">
                <p>Không cập nhật được danh sách: {query.error.message} Dữ liệu dưới đây có thể chưa mới nhất.</p>
                <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>Thử lại</Button>
              </div>
            )}
            <p role="status" className="text-sm text-muted-foreground">
              {query.isFetching ? "Đang cập nhật… " : ""}Tìm thấy {data.totalItems} đơn hàng.
            </p>
            <DataTable
              caption="Danh sách đơn hàng quản trị"
              columns={columns}
              rows={data.items}
              rowKey={(order) => order.id}
              sortBy={filters.sortBy}
              direction={filters.direction}
              onSort={changeSort}
              emptyMessage="Không tìm thấy đơn hàng phù hợp với bộ lọc."
            />
            <Pagination
              ariaLabel="Phân trang đơn quản trị"
              currentPage={filters.page}
              totalPages={data.totalPages}
              isFetching={query.isFetching}
              onPageChange={changePage}
            />
          </>
        )}
      </div>
    </section>
  );
}
