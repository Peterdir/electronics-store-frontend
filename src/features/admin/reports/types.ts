import type { DateRange } from "../dashboard/types";

export type ReportRange = DateRange;

export interface RevenueReportRow {
  date: string;
  totalOrders: number | null;
  grossRevenue: number | null;
  discountAmount: number | null;
  shippingFee: number | null;
  netRevenue: number | null;
}

export interface RevenueReport extends ReportRange {
  totalOrders: number | null;
  totalGrossRevenue: number | null;
  totalDiscountAmount: number | null;
  totalShippingFee: number | null;
  totalNetRevenue: number | null;
  items: RevenueReportRow[];
}
