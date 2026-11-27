import { CircleCheck, Clock3, LockKeyhole } from "lucide-react";
import { CompactStatusBadge } from "@/shared/components/CompactStatusBadge";
import type { UserStatus } from "@/shared/types/enums";
import { USER_STATUS_LABELS } from "../policy";

const statusAppearance = {
  ACTIVE: { tone: "success", icon: CircleCheck },
  INACTIVE: { tone: "danger", icon: LockKeyhole },
  PENDING: { tone: "pending", icon: Clock3 },
} as const;

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const { tone, icon } = statusAppearance[status];

  return (
    <CompactStatusBadge
      caption="Trạng thái tài khoản"
      label={USER_STATUS_LABELS[status]}
      tone={tone}
      icon={icon}
    />
  );
}
