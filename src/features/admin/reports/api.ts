import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { downloadFilename } from "@/shared/api/download";
import { createReportRangeSchema } from "./schemas";
import type { ReportRange, RevenueReport } from "./types";

export async function getRevenueReport(range: ReportRange, signal: AbortSignal, authToken: string) {
  const params = createReportRangeSchema().parse(range);
  const { data } = await api.get<RevenueReport>("/api/admin/reports/preview", {
    params,
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  if (data.startDate !== range.startDate || data.endDate !== range.endDate) {
    throw new ApiError(502, "Khoảng ngày trong báo cáo không khớp yêu cầu.");
  }
  return data;
}

export async function exportRevenueReport(range: ReportRange, signal: AbortSignal, authToken: string) {
  const params = createReportRangeSchema().parse(range);
  const { data, headers } = await api.get<Blob>("/api/admin/reports/export", {
    params,
    signal,
    responseType: "blob",
    meta: { authToken, noPublicRetry: true },
  });
  const contentType = String(headers["content-type"] ?? data.type).toLowerCase();
  if (contentType.includes("json") || contentType.includes("text/html")) {
    throw new ApiError(502, "Máy chủ không trả về file CSV hợp lệ.");
  }
  return {
    blob: data,
    filename: downloadFilename(
      headers["content-disposition"],
      `revenue_report_${range.startDate}_${range.endDate}.csv`,
    ),
  };
}
