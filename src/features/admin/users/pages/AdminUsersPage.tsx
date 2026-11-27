import { useEffect, useState, type SubmitEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { RequireRole } from "@/shared/auth/guards";
import { PERMISSIONS } from "@/shared/auth/permissions";
import { Pagination } from "@/shared/components/Pagination";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import { parseUserFilters, serializeUserFilters, USER_PAGE_SIZES } from "../filters";
import { UserStatusBadge } from "../components/UserStatusBadge";
import { useAdminUsers, useUsersSession, type UsersSession } from "../queries";
import type { AdminUser, UserFilters } from "../types";

export function AdminUsersPage() {
  const snapshot = useUsersSession();
  return (
    <RequireRole roles={PERMISSIONS["user.view"]}>
      {snapshot && (
        <UsersContent
          key={`${snapshot.userId}:${snapshot.role}:${snapshot.token}`}
          snapshot={snapshot}
        />
      )}
    </RequireRole>
  );
}

function UsersContent({ snapshot }: { snapshot: UsersSession }) {
  const [search, setSearch] = useSearchParams();
  const filters = parseUserFilters(search);
  const canonicalSearch = serializeUserFilters(filters).toString();
  const query = useAdminUsers(filters, snapshot);

  useEffect(() => {
    if (search.toString() !== canonicalSearch) setSearch(canonicalSearch, { replace: true });
  }, [search, canonicalSearch, setSearch]);

  useEffect(() => {
    if (query.data && !query.isFetching && !query.isError && filters.page > Math.max(1, query.data.totalPages)) {
      setSearch(serializeUserFilters({
        keyword: filters.keyword,
        size: filters.size,
        page: Math.max(1, query.data.totalPages),
      }), { replace: true });
    }
  }, [query.data, query.isFetching, query.isError, filters.page, filters.keyword, filters.size, setSearch]);

  function changeFilters(patch: Partial<UserFilters>) {
    setSearch(serializeUserFilters({ ...filters, ...patch }));
  }

  const columns: DataTableColumn<AdminUser, never>[] = [
    { id: "id", header: "ID", cell: (user) => user.id },
    { id: "name", header: "Họ tên", align: "center", cell: (user) => user.fullName ?? "—" },
    { id: "email", header: "Email", align: "left", cell: (user) => <span className="wrap-anywhere">{user.email}</span> },
    { id: "phone", header: "Điện thoại", cell: (user) => user.phone || "—" },
    { id: "role", header: "Vai trò", cell: (user) => user.role },
    {
      id: "status",
      header: "Trạng thái",
      cell: (user) => <UserStatusBadge status={user.status} />,
    },
    {
      id: "detail",
      header: "Thao tác",
      cell: (user) => <Link className="text-primary underline underline-offset-4" to={`/admin/users/${user.id}`}>Xem chi tiết</Link>,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Quản lý người dùng" />
      <UsersSearchForm key={canonicalSearch} keyword={filters.keyword} onApply={(keyword) => changeFilters({ keyword, page: 1 })} />
      <label className="flex items-center gap-3 text-sm">
        <span>Số dòng mỗi trang</span>
        <select
          value={filters.size}
          onChange={(event) => changeFilters({ size: Number(event.target.value), page: 1 })}
          className="rounded-lg border border-input bg-background p-2"
        >
          {USER_PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      {query.isPending && <p role="status">Đang tải người dùng…</p>}
      {query.isError && <p role="alert" className="text-destructive">{query.error.message} Nhấn F5 để tải lại trang.</p>}
      {query.data && (
        <>
          <p className="text-sm text-muted-foreground">{query.data.totalItems} người dùng • Trang {filters.page}{query.isFetching ? " • Đang cập nhật…" : ""}</p>
          <DataTable
            caption="Danh sách người dùng"
            columns={columns}
            rows={query.data.items}
            rowKey={(user) => user.id}
            emptyMessage="Không có người dùng phù hợp."
          />
          <Pagination
            currentPage={filters.page}
            totalPages={query.data.totalPages}
            isFetching={query.isFetching}
            onPageChange={(page) => changeFilters({ page })}
          />
        </>
      )}
    </div>
  );
}

function UsersSearchForm({ keyword, onApply }: { keyword: string; onApply: (keyword: string) => void }) {
  const [draft, setDraft] = useState(keyword);

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply(draft.trim());
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
      <label className="min-w-0 flex-1 space-y-2 text-sm">
        <span className="block font-medium">Tìm theo họ tên hoặc email</span>
        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="w-full rounded-lg border border-input bg-background p-2"
        />
      </label>
      <Button type="submit">Tìm kiếm</Button>
      <Button type="button" variant="outline" onClick={() => { setDraft(""); onApply(""); }}>Xóa bộ lọc</Button>
    </form>
  );
}
