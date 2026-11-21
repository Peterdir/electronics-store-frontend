import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime, formatVND } from "@/lib/format";
import { Pagination } from "@/shared/components/Pagination";
import { ProductStatus } from "@/shared/types/enums";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { FilterBar } from "../../components/FilterBar";
import { ProductStatusBadge } from "../components/ProductStatusBadge";
import {
  ADMIN_PRODUCT_PAGE_SIZES, parseAdminProductsFilters, productStatusLabels,
  serializeAdminProductsFilters, toAdminProductsParams,
} from "../filters";
import { useAdminProductBrands, useAdminProductCategories, useAdminProducts } from "../queries";
import type { AdminProductListResponse, AdminProductsFilters, AdminProductSortBy } from "../types";

function ProductThumbnail({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted">
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" className="size-full object-contain" onError={() => setFailed(true)} />
      ) : <span role="img" aria-label="Không có ảnh sản phẩm"><ImageOff aria-hidden="true" className="size-5 text-muted-foreground" /></span>}
    </div>
  );
}

const columns: readonly DataTableColumn<AdminProductListResponse, AdminProductSortBy>[] = [
  {
    id: "name", header: "Sản phẩm", sortBy: "name",
    cell: (product) => (
      <div className="flex max-w-80 gap-3">
        <ProductThumbnail key={product.primaryImageUrl} src={product.primaryImageUrl} />
        <div className="min-w-0 wrap-anywhere">
          <Link to={`/admin/products/${product.id}/edit`} className="font-semibold text-primary underline underline-offset-4" aria-label={`Sửa sản phẩm ${product.name}`}>{product.name}</Link>
          <p className="mt-1 text-xs text-muted-foreground">#{product.id}</p>
        </div>
      </div>
    ),
  },
  { id: "category", header: "Danh mục", cell: (product) => product.categoryName ?? "Chưa có danh mục" },
  { id: "brand", header: "Thương hiệu", cell: (product) => product.brandName ?? "Chưa có thương hiệu" },
  {
    id: "basePrice", header: "Giá cơ bản", sortBy: "basePrice",
    cell: (product) => <span className="whitespace-nowrap">{formatVND(product.basePrice)}</span>,
  },
  {
    id: "status", header: "Trạng thái",
    cell: (product) => <ProductStatusBadge status={product.status} />,
  },
  { id: "totalStock", header: "Tổng tồn", cell: (product) => product.totalStock },
  { id: "variantCount", header: "Số biến thể", cell: (product) => product.variantCount },
  { id: "createdAt", header: "Ngày tạo", sortBy: "createdAt", cell: (product) => formatDateTime(product.createdAt) },
];

const fieldClassName = "h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";

export function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseAdminProductsFilters(searchParams);
  const normalizedSearch = serializeAdminProductsFilters(filters).toString();
  const isCanonical = normalizedSearch === searchParams.toString();
  const debouncedKeyword = useDebounce(filters.keyword, 350);
  const isDebouncing = filters.keyword !== debouncedKeyword;
  const categories = useAdminProductCategories();
  const brands = useAdminProductBrands();
  const query = useAdminProducts(toAdminProductsParams(filters), isCanonical && !isDebouncing);
  const data = query.data;
  const lastPage = data ? Math.max(1, data.totalPages) : undefined;

  useEffect(() => {
    if (!isCanonical) setSearchParams(normalizedSearch, { replace: true });
  }, [isCanonical, normalizedSearch, setSearchParams]);

  useEffect(() => {
    if (
      !isCanonical || isDebouncing || query.isFetching || query.isError ||
      lastPage === undefined || filters.page <= lastPage
    ) return;
    setSearchParams((current) => serializeAdminProductsFilters({
      ...parseAdminProductsFilters(current), page: lastPage,
    }), { replace: true });
  }, [isCanonical, isDebouncing, query.isFetching, query.isError, lastPage, filters.page, setSearchParams]);

  function changeFilters(patch: Partial<Omit<AdminProductsFilters, "page">>, replace = false) {
    setSearchParams((current) => serializeAdminProductsFilters({
      ...parseAdminProductsFilters(current), ...patch, page: 1,
    }), { replace });
  }

  function changePage(page: number) {
    setSearchParams((current) => serializeAdminProductsFilters({ ...parseAdminProductsFilters(current), page }));
  }

  function changeSort(sortBy: AdminProductSortBy) {
    changeFilters({ sortBy, direction: filters.sortBy === sortBy && filters.direction === "asc" ? "desc" : "asc" });
  }

  const correctingPage = !query.isError && lastPage !== undefined && filters.page > lastPage;
  const waiting = !isCanonical || isDebouncing || (query.isPending && !query.isError) || correctingPage;
  const missingCategory = filters.categoryId && !categories.data?.some((category) => category.id === filters.categoryId);
  const missingBrand = filters.brandId && !brands.data?.some((brand) => brand.id === filters.brandId);

  return (
    <section className="space-y-6">
      <AdminPageHeader title="Quản lý sản phẩm" description="Tìm theo tên hoặc mô tả, bao gồm sản phẩm đang bán, ngừng bán và đang ẩn."
        actions={<Link to="/admin/products/new" className="inline-flex min-h-10 items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring">Tạo sản phẩm</Link>} />
      <FilterBar>
        <label className="grid min-w-56 flex-1 gap-2 text-sm font-medium">
          Tìm kiếm sản phẩm
          <input type="search" className={fieldClassName} value={filters.keyword} placeholder="Tên hoặc mô tả sản phẩm"
            onChange={(event) => changeFilters({ keyword: event.target.value }, true)} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Trạng thái
          <select className={fieldClassName} value={filters.status ?? ""} onChange={(event) => changeFilters({
            status: Object.values(ProductStatus).find((status) => status === event.target.value),
          })}>
            <option value="">Tất cả trạng thái</option>
            {Object.values(ProductStatus).map((status) => <option key={status} value={status}>{productStatusLabels[status]}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Danh mục
          <select className={fieldClassName} value={filters.categoryId ?? ""} onChange={(event) => changeFilters({ categoryId: event.target.value || undefined })}>
            <option value="">Tất cả danh mục</option>
            {missingCategory && <option value={filters.categoryId}>Danh mục #{filters.categoryId} (chưa có trong lựa chọn)</option>}
            {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}{category.status === "INACTIVE" ? " (ngừng hoạt động)" : ""}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Thương hiệu
          <select className={fieldClassName} value={filters.brandId ?? ""} onChange={(event) => changeFilters({ brandId: event.target.value || undefined })}>
            <option value="">Tất cả thương hiệu</option>
            {missingBrand && <option value={filters.brandId}>Thương hiệu #{filters.brandId} (chưa có trong lựa chọn)</option>}
            {brands.data?.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}{brand.status === "INACTIVE" ? " (ngừng hoạt động)" : ""}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Số dòng
          <select className={fieldClassName} value={filters.size} onChange={(event) => changeFilters({
            size: ADMIN_PRODUCT_PAGE_SIZES.find((size) => String(size) === event.target.value) ?? 10,
          })}>
            {ADMIN_PRODUCT_PAGE_SIZES.map((size) => <option key={size} value={size}>{size} / trang</option>)}
          </select>
        </label>
        <Button variant="outline" type="button" className="h-10" onClick={() => setSearchParams(serializeAdminProductsFilters(parseAdminProductsFilters(new URLSearchParams())))}>Xóa bộ lọc</Button>
      </FilterBar>

      {categories.isPending && <p role="status" className="text-sm text-muted-foreground">Đang tải lựa chọn danh mục…</p>}
      {brands.isPending && <p role="status" className="text-sm text-muted-foreground">Đang tải lựa chọn thương hiệu…</p>}
      {categories.isError && (
        <div role="alert" className="space-y-2 text-sm">
          <p>Không cập nhật được lựa chọn danh mục: {categories.error.message} Bộ lọc hiện tại vẫn được giữ.</p>
          <Button variant="outline" disabled={categories.isFetching} onClick={() => void categories.refetch()}>Tải lại danh mục</Button>
        </div>
      )}
      {brands.isError && (
        <div role="alert" className="space-y-2 text-sm">
          <p>Không cập nhật được lựa chọn thương hiệu: {brands.error.message} Bộ lọc hiện tại vẫn được giữ.</p>
          <Button variant="outline" disabled={brands.isFetching} onClick={() => void brands.refetch()}>Tải lại thương hiệu</Button>
        </div>
      )}

      <div aria-busy={waiting || query.isFetching} className="space-y-4">
        {waiting ? <p role="status">{isDebouncing ? "Đang chờ bạn nhập xong…" : "Đang tải sản phẩm…"}</p> : !data ? (
          <div role="alert" className="space-y-3">
            <p>{query.error?.message || "Không tải được danh sách sản phẩm."}</p>
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
            <p role="status" className="text-sm text-muted-foreground">{query.isFetching ? "Đang cập nhật… " : ""}Tìm thấy {data.totalItems} sản phẩm.</p>
            <p className="text-xs text-muted-foreground">Tổng tồn và số biến thể do máy chủ tính, bao gồm cả biến thể ngừng bán.</p>
            <DataTable caption="Danh sách sản phẩm quản trị" columns={columns} rows={data.items} rowKey={(product) => product.id}
              sortBy={filters.sortBy} direction={filters.direction} onSort={changeSort} emptyMessage="Không có sản phẩm phù hợp với bộ lọc." />
            <Pagination ariaLabel="Phân trang sản phẩm quản trị" currentPage={filters.page} totalPages={data.totalPages} isFetching={query.isFetching} onPageChange={changePage} />
          </>
        )}
      </div>
    </section>
  );
}
