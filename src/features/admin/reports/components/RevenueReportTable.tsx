import { formatVND } from "@/lib/format";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import type { RevenueReport, RevenueReportRow } from "../types";

const money = (value: number | null) => value == null ? "—" : formatVND(value);

const columns: DataTableColumn<RevenueReportRow, never>[] = [
  { id: "date", header: "Ngày", cell: (row) => row.date },
  { id: "orders", header: "Số đơn", cell: (row) => row.totalOrders ?? "—" },
  { id: "gross", header: "Tiền hàng", cell: (row) => money(row.grossRevenue), align: "right" },
  { id: "discount", header: "Giảm giá", cell: (row) => money(row.discountAmount), align: "right" },
  { id: "shipping", header: "Phí vận chuyển", cell: (row) => money(row.shippingFee), align: "right" },
  { id: "net", header: "Doanh thu sau giảm giá, gồm phí vận chuyển", cell: (row) => money(row.netRevenue), align: "right" },
];

export function RevenueReportTable({ report }: { report: RevenueReport }) {
  const totals = [
    { label: "Tổng số đơn", value: report.totalOrders ?? "—" },
    { label: "Tổng tiền hàng", value: money(report.totalGrossRevenue) },
    { label: "Tổng giảm giá", value: money(report.totalDiscountAmount) },
    { label: "Tổng phí vận chuyển", value: money(report.totalShippingFee) },
    { label: "Tổng doanh thu sau giảm giá, gồm phí vận chuyển", value: money(report.totalNetRevenue) },
  ];

  return (
    <div className="space-y-4">
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {totals.map((total) => (
          <div key={total.label} className="rounded-xl border border-border bg-card p-4">
            <dt className="text-sm text-muted-foreground">{total.label}</dt>
            <dd className="mt-2 text-xl font-semibold tabular-nums">{total.value}</dd>
          </div>
        ))}
      </dl>
      {report.totalOrders === 0 && (
        <p role="status">Không có đơn hàng phù hợp trong khoảng ngày này. Các dòng ngày có thể có giá trị 0.</p>
      )}
      <DataTable
        caption={`Doanh thu từ ${report.startDate} đến ${report.endDate}`}
        columns={columns}
        rows={report.items}
        rowKey={(row) => row.date}
        emptyMessage="Không có dòng báo cáo."
      />
    </div>
  );
}
