import type { ID } from "@/shared/types/common";
import type { Role, UserStatus } from "@/shared/types/enums";

export interface AdminUser {
  id: ID;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: Role;
  status: UserStatus;
}

export interface UserFilters {
  keyword: string;
  page: number;
  size: number;
}

export type UserAction =
  | { kind: "status"; value: "ACTIVE" | "INACTIVE" }
  | { kind: "role"; value: Role };
