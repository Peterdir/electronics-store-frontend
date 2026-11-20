import type { ID, ISODateTime } from "@/shared/types/common";
import type { CategoryStatus } from "@/shared/types/enums";

export interface AdminCategoryResponse {
  id: ID;
  name: string;
  status: CategoryStatus;
  totalProducts: number;
  imageUrl: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
