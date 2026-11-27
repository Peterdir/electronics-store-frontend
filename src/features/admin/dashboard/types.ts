import type { ID } from "@/shared/types/common";
import type { OrderStatus } from "@/shared/types/enums";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DashboardStats {
  totalRevenue: number | null;
  totalOrders: number | null;
  newUsers: number | null;
  lowStockCount: number | null;
}

export interface RevenueChartPoint {
  date: string;
  revenue: number | null;
  orderCount: number | null;
}

export interface OrderStatusStat {
  status: OrderStatus;
  count: number | null;
}

export interface LowStockProduct {
  productVariantId: ID | null;
  productName: string | null;
  sku: string | null;
  quantity: number | null;
}

export interface DashboardOverview {
  stats: DashboardStats | null;
  revenueChart: RevenueChartPoint[] | null;
  orderStatusDistribution: OrderStatusStat[] | null;
  lowStockAlerts: LowStockProduct[] | null;
}
