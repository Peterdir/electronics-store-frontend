import { hasPermission } from "@/shared/auth/permissions";
import type { Role } from "@/shared/types/enums";
import type { AdminUser, UserAction } from "./types";

export interface UsersActor {
  userId: string;
  role: Role;
}

export const USER_STATUS_LABELS = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Đã khóa",
  PENDING: "Chờ xác thực",
} as const;

export function canChangeUserStatus(actor: UsersActor, target: AdminUser): boolean {
  return actor.userId !== target.id && hasPermission("user.changeStatus", actor.role) &&
    (actor.role === "ADMIN" || target.role === "CUSTOMER") &&
    (target.status === "ACTIVE" || target.status === "INACTIVE");
}

export function canChangeUserRole(actor: UsersActor, target: AdminUser): boolean {
  return actor.userId !== target.id && hasPermission("user.changeRole", actor.role);
}

export function canPerformUserAction(actor: UsersActor, target: AdminUser, action: UserAction): boolean {
  return action.kind === "role"
    ? canChangeUserRole(actor, target) && action.value !== target.role
    : canChangeUserStatus(actor, target) && action.value !== target.status;
}
