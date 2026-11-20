import { useEffect, useState } from "react";
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
import { CategoryFormDialog } from "../components/CategoryFormDialog";
import { DeleteCategoryDialog } from "../components/DeleteCategoryDialog";
import {
  CATEGORY_PAGE_SIZES, parseCategoryFilters, selectCategoryPage, serializeCategoryFilters,
  type CategoryFilters,
} from "../filters";
import { isCurrentCategorySession, useAdminCategories, useCategoryWritesPending, useCategorySession, type CategorySession } from "../queries";
import type { AdminCategoryResponse } from "../types";

type OpenDialog = (
  | { kind: "form"; category?: AdminCategoryResponse }
  | { kind: "delete"; category: AdminCategoryResponse }
) & { session: CategorySession };

const fieldClassName = "h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";

function CategoriesContent({ session }: { session: CategorySession }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const query = useAdminCategories();
  const writing = useCategoryWritesPending();
  const filters = parseCategoryFilters(searchParams);
  const selected = selectCategoryPage(query.data ?? [], filters);
  const normalizedSearch = serializeCategoryFilters({
    ...filters,
    page: query.isSuccess && !query.isFetching ? selected.page : filters.page,
  }).toString();

  useEffect(() => {
    if (searchParams.toString() !== normalizedSearch) {
      setSearchParams(normalizedSearch, { replace: true });
    }
  }, [searchParams, normalizedSearch, setSearchParams]);

  function changeFilters(patch: Partial<CategoryFilters>, replace = false) {
    setSearchParams((current) => serializeCategoryFilters({
      ...parseCategoryFilters(current), page: 1, ...patch,
    }), { replace });
  }

  const disabled = writing || query.isFetching || query.isError || !query.data;
  const forbidden = query.error instanceof ApiError && query.error.status === 403;
  const columns: DataTableColumn<AdminCategoryResponse, string>[] = [
    {
      id: "image", header: "Ảnh",
      cell: (category) => category.imageUrl
        ? <img src={category.imageUrl} alt="" loading="lazy" className="size-16 rounded-lg bg-muted object-contain" />
        : <span className="text-muted-foreground">Chưa có ảnh</span>,
    },
    {
      id: "name", header: "Danh mục",
      cell: (category) => (
        <div className="max-w-64 wrap-anywhere">
          <p className="font-semibold">{category.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">#{category.id}</p>
        </div>
      ),
    },
    {
      id: "status", header: "Trạng thái",
      cell: (category) => category.status === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động",
    },
    { id: "products", header: "Sản phẩm", cell: (category) => category.totalProducts },
    { id: "updatedAt", header: "Cập nhật", cell: (category) => formatDateTime(category.updatedAt) },
    {
      id: "actions", header: "Thao tác",
      cell: (category) => (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={disabled} aria-label={`Sửa danh mục ${category.name}`} onClick={() => setDialog({ kind: "form", category, session })}>Sửa</Button>
          <Button type="button" variant="destructive" disabled={disabled} aria-label={`Xóa danh mục ${category.name}`} onClick={() => setDialog({ kind: "delete", category, session })}>Xóa</Button>
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="Quản lý danh mục"
        description="Quản lý tên, trạng thái và ảnh của cả danh mục hoạt động lẫn ngừng hoạt động."
        actions={<Button type="button" disabled={disabled} onClick={() => setDialog({ kind: "form", session })}>Tạo danh mục</Button>}
      />
      <FilterBar>
        <label className="grid min-w-48 flex-1 gap-2 text-sm font-medium">
          Tìm theo tên
          <input type="search" className={fieldClassName} value={filters.keyword} onChange={(event) => changeFilters({ keyword: event.target.value }, true)} placeholder="Tên danh mục" />
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
          <select className={fieldClassName} value={filters.size} onChange={(event) => changeFilters({ size: CATEGORY_PAGE_SIZES.find((size) => size === Number(event.target.value)) ?? 10 })}>
            {CATEGORY_PAGE_SIZES.map((size) => <option key={size} value={size}>{size} / trang</option>)}
          </select>
        </label>
        <Button type="button" variant="outline" className="h-10" onClick={() => setSearchParams({})}>Xóa bộ lọc</Button>
        <Button type="button" variant="outline" className="h-10" disabled={query.isFetching || writing} onClick={() => { void query.refetch(); }}>Tải lại</Button>
      </FilterBar>
      <div aria-busy={query.isFetching} className="space-y-4">
        {query.isPending && <p role="status">Đang tải danh mục…</p>}
        {query.isError && (
          <div role="alert" className="space-y-1 rounded-xl border border-destructive/30 p-4 text-sm text-destructive">
            <p>{query.error.message}</p>
            <p>{forbidden ? "Máy chủ từ chối quyền. Vui lòng đăng nhập lại để cập nhật phiên." : query.data
              ? "Dữ liệu đang hiển thị có thể đã cũ. Nếu vừa lưu thành công, chỉ tải lại danh sách; không cần lưu lần nữa."
              : "Không tải được danh mục. Hãy thử Tải lại."}</p>
          </div>
        )}
        {query.data && (
          <>
            <p role="status" className="text-sm text-muted-foreground">{selected.totalItems} danh mục{query.isFetching ? " · Đang cập nhật…" : ""}</p>
            <DataTable caption="Danh sách danh mục" columns={columns} rows={selected.rows} rowKey={(category) => category.id} emptyMessage="Không có danh mục phù hợp." />
            <Pagination currentPage={selected.page} totalPages={selected.totalPages} isFetching={query.isFetching || writing} onPageChange={(page) => changeFilters({ page })} ariaLabel="Phân trang danh mục" />
          </>
        )}
      </div>
      {dialog && isCurrentCategorySession(dialog.session) && (dialog.kind === "form"
        ? <CategoryFormDialog category={dialog.category} session={dialog.session} onClose={() => setDialog(null)} />
        : <DeleteCategoryDialog category={dialog.category} session={dialog.session} onClose={() => setDialog(null)} />)}
    </section>
  );
}

export function AdminCategoriesPage() {
  const session = useCategorySession();
  return (
    <RequireRole roles={PERMISSIONS["category.manage"]}>
      {session && <CategoriesContent key={`${session.userId}:${session.role}`} session={session} />}
    </RequireRole>
  );
}
