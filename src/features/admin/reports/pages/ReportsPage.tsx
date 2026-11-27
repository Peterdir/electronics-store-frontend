import { useState } from "react";
import { RequireRole } from "@/shared/auth/guards";
import { PERMISSIONS } from "@/shared/auth/permissions";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { ExportReportButton } from "../components/ExportReportButton";
import { ReportDateRangeForm } from "../components/ReportDateRangeForm";
import { RevenueReportTable } from "../components/RevenueReportTable";
import { useReportsSession, useRevenueReport, type ReportsSession } from "../queries";
import type { ReportRange } from "../types";

export function ReportsPage() {
  const snapshot = useReportsSession();

  return (
    <RequireRole roles={PERMISSIONS["report.view"]}>
      {snapshot && (
        <ReportsContent
          key={`${snapshot.userId}:${snapshot.role}:${snapshot.token}`}
          snapshot={snapshot}
        />
      )}
    </RequireRole>
  );
}

function ReportsContent({ snapshot }: { snapshot: ReportsSession }) {
  const [submittedRange, setSubmittedRange] = useState<ReportRange | null>(null);
  const query = useRevenueReport(submittedRange, snapshot);
  const report = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Báo cáo doanh thu" />
      <ReportDateRangeForm onPreview={setSubmittedRange} />
      {!submittedRange ? (
        <p>Chọn khoảng ngày và bấm Xem trước để tải báo cáo.</p>
      ) : (
        <section className="space-y-4" aria-label="Kết quả báo cáo" aria-busy={query.isFetching}>
          <h2 className="text-lg font-semibold">
            Khoảng báo cáo đã gửi: {submittedRange.startDate} → {submittedRange.endDate}
          </h2>
          {query.isPending && <p role="status">Đang tải báo cáo…</p>}
          {query.isError && (
            <p role="alert" className="text-destructive">
              {query.error.message} {report ? "Số liệu dưới đây là dữ liệu đã tải trước đó. " : ""}
              Nhấn F5 để tải lại trang rồi chọn khoảng ngày; nếu bị từ chối quyền, hãy đăng nhập lại bằng tài khoản phù hợp.
            </p>
          )}
          {report && (
            <>
              {query.isFetching && <p role="status">Đang cập nhật báo cáo…</p>}
              <ExportReportButton
                key={`${submittedRange.startDate}:${submittedRange.endDate}`}
                range={submittedRange}
                snapshot={snapshot}
                disabled={query.isFetching || query.isError}
              />
              <RevenueReportTable report={report} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
