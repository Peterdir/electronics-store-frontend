import { useEffect, useState } from "react";
import { CircleCheck, Pause } from "lucide-react";
import { CompactStatusBadge } from "@/shared/components/CompactStatusBadge";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { RequireRole } from "@/shared/auth/guards";
import { PERMISSIONS } from "@/shared/auth/permissions";
import { Pagination } from "@/shared/components/Pagination";
import { formatDateTime } from "@/lib/format";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { BrandFormDialog } from "../components/BrandFormDialog";
import { DeleteBrandDialog } from "../components/DeleteBrandDialog";
import {
  BRAND_PAGE_SIZES, parseBrandFilters, selectBrandPage, serializeBrandFilters,
  type BrandFilters,
} from "../filters";
import { isCurrentBrandSession, useAdminBrands, useBrandWritesPending, useBrandSession, type BrandSession } from "../queries";
import type { AdminBrandResponse } from "../types";

type OpenDialog = (
  | { kind: "form"; brand?: AdminBrandResponse }
  | { kind: "delete"; brand: AdminBrandResponse }
) & { session: BrandSession };

const fieldClassName = "h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";

function BrandsContent({ session }: { session: BrandSession }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const query = useAdminBrands();
  const writing = useBrandWritesPending();
  const filters = parseBrandFilters(searchParams);
  const selected = selectBrandPage(query.data ?? [], filters);
  const normalizedSearch = serializeBrandFilters({
    ...filters,
    page: query.isSuccess && !query.isFetching ? selected.page : filters.page,
  }).toString();

  useEffect(() => {
    if (searchParams.toString() !== normalizedSearch) {
      setSearchParams(normalizedSearch, { replace: true });
    }
  }, [searchParams, normalizedSearch, setSearchParams]);

  function changeFilters(patch: Partial<BrandFilters>, replace = false) {
    setSearchParams((current) => serializeBrandFilters({
      ...parseBrandFilters(current), page: 1, ...patch,
    }), { replace });
  }

  const disabled = writing || query.isFetching || query.isError || !query.data;
  const forbidden = query.error instanceof ApiError && query.error.status === 403;
  const columns: DataTableColumn<AdminBrandResponse, string>[] = [
    {
      id: "logo",
      header: "Logo",
      cell: (brand) => brand.logo
        ? <img src={brand.logo} alt="" loading="lazy" className="size-16 rounded-lg bg-muted object-contain" />
        : <span className="text-muted-foreground">Chưa có logo</span>,
    },
    {
      id: "name",
      header: "Thương hiệu",
      cell: (brand) => (<div className="max-w-64 wrap-anywhere">
        <p className="font-semibold">{brand.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">#{brand.id}</p>
      </div>),
    },
    {
      id: "status",
      header: "Trạng thái",
      align: "center",
      cell: (brand) => (
        <CompactStatusBadge
          caption="Trạng thái thương hiệu"
          label={brand.status === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động"}
          tone={brand.status === "ACTIVE" ? "success" : "pending"}
          icon={brand.status === "ACTIVE" ? CircleCheck : Pause}
        />
      ),
    },
    {
      id: "products",
      header: "Sản phẩm",
      cell: (brand) => brand.totalProducts,
    },
    {
      id: "updatedAt",
      header: "Cập nhật",
      cell: (brand) => formatDateTime(brand.updatedAt),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: (brand) => (<div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={disabled} aria-label={`Sửa thương hiệu ${brand.name}`} onClick={() => setDialog({ kind: "form", brand, session })}>Sửa</Button>
        <Button type="button" variant="destructive" disabled={disabled} aria-label={`Xóa thương hiệu ${brand.name}`} onClick={() => setDialog({ kind: "delete", brand, session })}>Xóa</Button>
      </div>),
    },
  ];

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="Quản lý thương hiệu"
        description="Quản lý tên, trạng thái và logo của cả thương hiệu hoạt động lẫn ngừng hoạt động."
        actions={<Button type="button" disabled={disabled} onClick={() => setDialog({ kind: "form", session })}>Tạo thương hiệu</Button>}
      />
      <FilterBar>
        <label className="grid min-w-48 flex-1 gap-2 text-sm font-medium">
          Tìm theo tên
          <input type="search" className={fieldClassName} value={filters.keyword} onChange={(event) => changeFilters({ keyword: event.target.value }, true)} placeholder="Tên thương hiệu" />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Trạng thái
          <select className={fieldClassName} value={filters.status} onChange={(event) => changeFilters({ status: event.target.value })}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Số dòng
          <select className={fieldClassName} value={filters.size} onChange={(event) => changeFilters({ size: BRAND_PAGE_SIZES.find((size) => size === Number(event.target.value)) ?? 10 })}>
            {BRAND_PAGE_SIZES.map((size) => <option key={size} value={size}>{size} / trang</option>)}
          </select>
        </label>
        <Button type="button" variant="outline" className="h-10" onClick={() => setSearchParams({})}>Xóa bộ lọc</Button>
      </FilterBar>
      <div aria-busy={query.isFetching} className="space-y-4">
        {query.isPending && <p role="status">Đang tải thương hiệu…</p>}
        {query.isError && (
          <div role="alert" className="space-y-1 rounded-xl border border-destructive/30 p-4 text-sm text-destructive">
            <p>{query.error.message}</p>
            <p>{forbidden ? "Máy chủ từ chối quyền. Vui lòng đăng nhập lại để cập nhật phiên." : query.data
              ? "Dữ liệu đang hiển thị có thể đã cũ. Nhấn F5 để tải lại trang; nếu vừa lưu thành công, không cần lưu lần nữa."
              : "Không tải được thương hiệu. Nhấn F5 để tải lại trang."}</p>
          </div>
        )}
        {query.data && (
          <>
            <p role="status" className="text-sm text-muted-foreground">{selected.totalItems} thương hiệu{query.isFetching ? " · Đang cập nhật…" : ""}</p>
            <DataTable caption="Danh sách thương hiệu" columns={columns} rows={selected.rows} rowKey={(brand) => brand.id} emptyMessage="Không có thương hiệu phù hợp." />
            <Pagination currentPage={selected.page} totalPages={selected.totalPages} isFetching={query.isFetching || writing} onPageChange={(page) => changeFilters({ page })} ariaLabel="Phân trang thương hiệu" />
          </>
        )}
      </div>
      {dialog && isCurrentBrandSession(dialog.session) && (dialog.kind === "form"
        ? <BrandFormDialog brand={dialog.brand} session={dialog.session} onClose={() => setDialog(null)} />
        : <DeleteBrandDialog brand={dialog.brand} session={dialog.session} onClose={() => setDialog(null)} />)}
    </section>
  );
}

export function AdminBrandsPage() {
  const session = useBrandSession();
  return (
    <RequireRole roles={PERMISSIONS["brand.manage"]}>
      {session && <BrandsContent key={`${session.userId}:${session.role}`} session={session} />}
    </RequireRole>
  );
}
