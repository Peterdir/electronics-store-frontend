import type { ID, ISODateTime } from "@/shared/types/common";

export interface AdminReview {
  id: ID;
  productName: string | null;
  customerName: string | null;
  rating: number;
  reviewText: string | null;
  createdAt: ISODateTime;
  hidden: boolean;
  adminReply: string | null;
}

export interface ReviewFilters {
  productName: string;
  rating: number | null;
  page: number;
  size: number;
}

export interface MessageResponse {
  message: string;
}

export type ReviewAction = "reply" | "toggle";
