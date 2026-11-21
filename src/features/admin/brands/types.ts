import type { ID, ISODateTime } from "@/shared/types/common";
import type { BrandStatus } from "@/shared/types/enums";

export interface AdminBrandResponse {
  id: ID;
  name: string;
  status: BrandStatus;
  totalProducts: number;
  logo: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
