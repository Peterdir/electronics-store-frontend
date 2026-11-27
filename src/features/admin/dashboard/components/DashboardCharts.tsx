import { useId } from "react";
import { formatVND } from "@/lib/format";
import { orderStatusLabels } from "@/features/orders/orderStatus";
import type { OrderStatusStat, RevenueChartPoint } from "../types";

interface DailyChartProps {
  points: RevenueChartPoint[];
  metric: "revenue" | "orderCount";
  title: string;
  unit: string;
}

function DailyChart({ points, metric, title, unit }: DailyChartProps) {
  const titleId = useId();
  const width = Math.max(640, points.length * 14);
  const hasNegative = points.some((point) => (point[metric] ?? 0) < 0);
  const baseline = hasNegative ? 106 : 176;
  const plotHeight = hasNegative ? 70 : 140;
  const maximum = Math.max(1, ...points.map((point) => Math.abs(point[metric] ?? 0)));
  const step = (width - 80) / Math.max(1, points.length);
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));
  const display = (value: number) => metric === "revenue" ? formatVND(value) : `${value} đơn`;

  return (
    <section className="min-w-0 space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 id={titleId} className="font-semibold">{title} ({unit})</h2>
      {points.length === 0 ? <p className="text-sm text-muted-foreground">Không có dữ liệu theo ngày.</p> : (
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`${title}, cuộn ngang để xem các ngày`}>
          <svg width={width} height={220} role="img" aria-labelledby={titleId}>
            <line x1={40} y1={baseline} x2={width - 40} y2={baseline} stroke="currentColor" opacity={0.3} />
            {points.map((point, index) => {
              const value = point[metric];
              const height = value == null ? 0 : Math.abs(value) / maximum * plotHeight;
              const x = 40 + index * step;

              return (
                <g key={point.date}>
                  <title>{`${point.date}: ${value == null ? "Chưa có số liệu" : display(value)}`}</title>
                  <rect
                    x={x + step * 0.15}
                    y={value != null && value < 0 ? baseline : baseline - height}
                    width={Math.max(1, step * 0.7)}
                    height={height}
                    rx={2}
                    className={metric === "revenue" ? "fill-primary" : "fill-foreground/70"}
                  />
                  {(index % labelEvery === 0 || index === points.length - 1) && (
                    <text x={x + step / 2} y={200} textAnchor="middle" fontSize={11} fill="currentColor">
                      {point.date.slice(5)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </section>
  );
}

export function DashboardCharts({ points, distribution }: {
  points: RevenueChartPoint[];
  distribution: OrderStatusStat[];
}) {
  const maximumCount = Math.max(1, ...distribution.map((item) => item.count ?? 0));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-2">
        <DailyChart
          points={points}
          metric="revenue"
          title="Doanh thu theo ngày"
          unit="VND"
        />
        <DailyChart
          points={points}
          metric="orderCount"
          title="Đơn hàng theo ngày"
          unit="đơn"
        />
      </div>
      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Phân bố trạng thái đơn (đơn)</h2>
        {distribution.length === 0 ? <p className="text-sm text-muted-foreground">Không có đơn hàng trong khoảng này.</p> : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {distribution.map((item) => (
              <li key={item.status} className="space-y-2">
                <div className="flex justify-between gap-4 text-sm">
                  <span>{orderStatusLabels[item.status] ?? item.status}</span>
                  <span className="tabular-nums">{item.count == null ? "—" : `${item.count} đơn`}</span>
                </div>
                <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(item.count ?? 0) / maximumCount * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <details className="rounded-xl border border-border bg-card p-4">
        <summary className="cursor-pointer font-medium">Xem bảng số liệu theo ngày ({points.length} ngày)</summary>
        <div className="mt-4 max-h-96 overflow-auto">
          <table className="w-full min-w-100 text-sm">
            <caption className="sr-only">Số liệu chính xác dùng cho hai biểu đồ theo ngày</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="p-3 text-left">Ngày</th>
                <th scope="col" className="p-3 text-right">Doanh thu (VND)</th>
                <th scope="col" className="p-3 text-right">Số đơn</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.date} className="border-b border-border">
                  <th scope="row" className="p-3 text-left font-normal">{point.date}</th>
                  <td className="p-3 text-right tabular-nums">
                    {point.revenue == null ? "—" : formatVND(point.revenue)}
                  </td>
                  <td className="p-3 text-right tabular-nums">{point.orderCount ?? "—"}</td>
                </tr>
              ))}
              {points.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-3">Không có dữ liệu.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
