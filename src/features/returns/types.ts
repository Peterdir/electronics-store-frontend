import type { ID, ISODateTime } from "@/shared/types/common";
import type { ReturnStatus } from "@/shared/types/enums";

export interface CreateReturnRequest {
  orderItemId: ID;
  quantity: number;
  reason: string;
  description: string;
  images: File[];
}

export interface ReturnRequestResponse {
  id: ID;
  orderId: ID;
  orderItemId: ID;
  quantity: number;
  reason: string;
  description: string | null;
  adminNote: string | null;
  status: ReturnStatus;
  imageUrls: string[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
