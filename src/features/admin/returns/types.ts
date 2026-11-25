import type { ID, ISODateTime } from "@/shared/types/common";
import type { ReturnStatus } from "@/shared/types/enums";

export interface AdminReturnRequest {
  id: ID;
  orderId: ID;
  orderItemId: ID;
  quantity: number;
  reason: string;
  description: string | null;
  adminNote: string | null;
  status: ReturnStatus;
  imageUrls: string[] | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ReturnFilters {
  status: ReturnStatus;
  page: number;
  size: number;
}

export const returnStatusLabels: Record<ReturnStatus, string> = {
  PENDING: "Chờ xử lý",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};
