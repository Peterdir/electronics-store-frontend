import { useEffect, useState, type SubmitEvent } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/format";
import { Pagination } from "@/shared/components/Pagination";
import { hasPermission } from "@/shared/auth/permissions";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { CouponActionDialog } from "../components/CouponActionDialog";
import { CouponStatusBadge } from "../components/CouponStatusBadge";
import { COUPON_PAGE_SIZES, parseCouponFilters, selectCouponPage, serializeCouponFilters, type CouponFilters } from "../filters";
import { useAdminCoupons, useCouponsSession, type CouponsSession } from "../queries";
import { COUPON_STATUS_LABELS } from "../status";
import { formatCouponTime } from "../time";
import type { AdminCoupon } from "../types";

export function CouponsPage() {
  const snapshot = useCouponsSession();
  if (!snapshot) return <p role="alert">Vui lòng đăng nhập lại.</p>;

  return <CouponsContent key={`${snapshot.userId}:${snapshot.role}:${snapshot.token}`} snapshot={snapshot} />;
}

function CouponsContent({ snapshot }: { snapshot: CouponsSession }) {
  const [search, setSearch] = useSearchParams();
  const filters = parseCouponFilters(search);
  const query = useAdminCoupons(snapshot);
  const [now, setNow] = useState(Date.now);
  const [notice, setNotice] = useState("");
  const [blocked, setBlocked] = useState(false);
  const result = selectCouponPage(query.data ?? [], filters, now);
  const canManage = hasPermission("coupon.manage", snapshot.role);
  const canonical = serializeCouponFilters({ ...filters, page: query.data ? result.page : filters.page }).toString();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (canonical !== search.toString()) setSearch(canonical, { replace: true });
  }, [canonical, search, setSearch]);

  function changeFilters(patch: Partial<CouponFilters>) {
    setSearch(serializeCouponFilters({ ...filters, page: 1, ...patch }));
  }

  const actionProps = {
    snapshot,
    blocked: blocked || query.isError || query.isFetching,
    onBlocked: () => setBlocked(true),
    onNotice: setNotice,
  };

  const columns: DataTableColumn<AdminCoupon, never>[] = [
    { id: "code", header: "Mã coupon", cell: (coupon) => <span className="max-w-48 font-medium wrap-anywhere">{coupon.code}</span> },
    { id: "discount", header: "Giảm giá", cell: (coupon) => coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : formatVND(coupon.discountValue) },
    { id: "minimum", header: "Đơn tối thiểu", cell: (coupon) => formatVND(coupon.minOrderValue) },
    { id: "usage", header: "Đã dùng / giới hạn", cell: (coupon) => `${coupon.usedCount} / ${coupon.usageLimit}` },
    {
      id: "period", header: "Hiệu lực (giờ VN)",
      cell: (coupon) => (
        <div className="space-y-1 whitespace-nowrap text-xs">
          <p>Từ {formatCouponTime(coupon.startDate)}</p>
          <p>Đến {formatCouponTime(coupon.endDate)}</p>
        </div>
      ),
    },
    { id: "status", header: "Trạng thái", cell: (coupon) => <CouponStatusBadge coupon={coupon} now={now} /> },
  ];

  if (canManage) {
    columns.push({
      id: "actions", header: "Thao tác",
      cell: (coupon) => (
        <div className="flex flex-wrap justify-center gap-2">
          <CouponActionDialog coupon={coupon} {...actionProps} />
          <CouponActionDialog coupon={coupon} toggle {...actionProps} />
        </div>
      ),
    });
  }

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="Quản lý coupon"
        description="Hiệu lực hiển thị theo giờ Việt Nam; checkout kiểm tra điều kiện và tính giảm giá trên máy chủ."
        actions={canManage ? <CouponActionDialog {...actionProps} /> : undefined}
      />
      {!canManage && <p className="text-sm text-muted-foreground">Bạn có quyền xem danh sách coupon.</p>}
      <CouponFiltersForm key={serializeCouponFilters(filters).toString()} filters={filters} onChange={changeFilters} />
      {notice && <p role="status" className="rounded-xl border border-border p-4 text-sm leading-6">{notice}</p>}
      {blocked && <p role="alert" className="text-sm">Thao tác ghi đã khóa. Hãy xác minh kết quả máy chủ trước khi mở lại trang để thao tác tiếp.</p>}
      {query.isPending && <p role="status">Đang tải coupon…</p>}
      {query.isError && <p role="alert">{query.error.message} Nhấn F5 để tải lại trang. Dữ liệu cũ nếu còn hiển thị có thể chưa cập nhật.</p>}
      {query.data && (
        <>
          <p className="text-sm text-muted-foreground">{result.totalItems} coupon phù hợp{query.isFetching ? " • Đang cập nhật…" : ""}</p>
          <DataTable caption="Danh sách coupon" columns={columns} rows={result.rows} rowKey={(coupon) => coupon.id} />
          <Pagination currentPage={result.page} totalPages={result.totalPages} isFetching={query.isFetching} onPageChange={(page) => changeFilters({ page })} />
        </>
      )}
    </section>
  );
}

function CouponFiltersForm({ filters, onChange }: { filters: CouponFilters; onChange: (patch: Partial<CouponFilters>) => void }) {
  const [keyword, setKeyword] = useState(filters.keyword);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({ keyword: keyword.trim() });
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
      <label className="space-y-2 text-sm">
        <span className="block">Tìm mã coupon</span>
        <input value={keyword} onChange={(event) => setKeyword(event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2" />
      </label>
      <Button type="submit" variant="outline">Tìm kiếm</Button>
      <label className="space-y-2 text-sm">
        <span className="block">Trạng thái hiệu lực</span>
        <select value={filters.status} onChange={(event) => onChange({ status: event.target.value as CouponFilters["status"] })} className="rounded-lg border border-input bg-background px-3 py-2">
          <option value="">Tất cả</option>
          {Object.entries(COUPON_STATUS_LABELS).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
        </select>
      </label>
      <label className="space-y-2 text-sm">
        <span className="block">Số dòng</span>
        <select value={filters.size} onChange={(event) => onChange({ size: Number(event.target.value) })} className="rounded-lg border border-input bg-background px-3 py-2">
          {COUPON_PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
    </form>
  );
}
