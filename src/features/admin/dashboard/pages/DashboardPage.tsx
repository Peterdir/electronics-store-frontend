import { useSearchParams } from "react-router";
import { formatVND } from "@/lib/format";
import { RequireRole } from "@/shared/auth/guards";
import { PERMISSIONS } from "@/shared/auth/permissions";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { DashboardCharts } from "../components/DashboardCharts";
import { LowStockTable } from "../components/LowStockTable";
import { StatCard } from "../components/StatCard";
import { parseDateRange, serializeDateRange, validateDateRange } from "../dateRange";
import { useAdminDashboard, useDashboardSession, type DashboardSession } from "../queries";

export function DashboardPage() {
  const snapshot = useDashboardSession();

  return (
    <RequireRole roles={PERMISSIONS["dashboard.view"]}>
      {snapshot && (
        <DashboardContent
          key={`${snapshot.userId}:${snapshot.role}:${snapshot.token}`}
          snapshot={snapshot}
        />
      )}
    </RequireRole>
  );
}

function DashboardContent({ snapshot }: { snapshot: DashboardSession }) {
  const [search, setSearch] = useSearchParams();
  const range = parseDateRange(search);
  const rangeError = validateDateRange(range);
  const query = useAdminDashboard(range, snapshot);
  const data = query.data;
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard vận hành"
      />
      <DateRangeFilter
        key={serializeDateRange(range).toString()}
        range={range}
        onApply={(next) => setSearch(serializeDateRange(next))}
      />
      {rangeError ? (
        <p role="alert" className="text-destructive">
          {rangeError} Chọn lại khoảng ngày để tiếp tục.
        </p>
      ) : (
        <>
          {query.isPending && <p role="status">Đang tải dashboard…</p>}
          {query.isError && (
            <p role="alert" className="text-destructive">
              {query.error.message} {data ? "Số liệu dưới đây là dữ liệu đã tải trước đó. " : ""}
              Nhấn F5 để tải lại trang; nếu bị từ chối quyền, hãy đăng nhập lại bằng tài khoản phù hợp.
            </p>
          )}
          {data && (
            <div className="space-y-6" aria-busy={query.isFetching}>
              {query.isFetching && (
                <p role="status" className="text-sm text-muted-foreground">
                  Đang cập nhật số liệu…
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Doanh thu"
                  value={stats?.totalRevenue == null ? "—" : formatVND(stats.totalRevenue)}
                />
                <StatCard
                  label="Tổng đơn hàng"
                  value={String(stats?.totalOrders ?? "—")}
                />
                <StatCard
                  label="Khách hàng mới"
                  value={String(stats?.newUsers ?? "—")}
                />
                <StatCard
                  label="Biến thể tồn thấp"
                  value={String(stats?.lowStockCount ?? "—")}
                />
              </div>
              <DashboardCharts
                points={data.revenueChart ?? []}
                distribution={data.orderStatusDistribution ?? []}
              />
              <LowStockTable items={data.lowStockAlerts ?? []} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
