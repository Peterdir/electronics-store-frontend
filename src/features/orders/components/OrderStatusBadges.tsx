import {
  BadgeCheck,
  CircleCheck,
  CircleHelp,
  CircleMinus,
  CircleX,
  Clock3,
  Package,
  PackageOpen,
  RotateCcw,
  Truck,
  Undo2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { StatusBadge, type StatusEffect, type StatusTone } from "@/shared/components/StatusBadge";
import type { OrderStatus, PaymentStatus } from "@/shared/types/enums";
import { orderStatusLabels, orderStatusTones, paymentStatusLabels } from "../orderStatus";

type StatusAppearance = { tone: StatusTone; icon: LucideIcon };

const orderAppearance = {
  PENDING: { icon: Clock3, effect: "pulse" },
  PROCESSING: { icon: Package, effect: "lift" },
  SHIPPED: { icon: Truck, effect: "glide" },
  DELIVERED: { icon: CircleCheck, effect: "confirm" },
  CANCELLED: { icon: CircleX, effect: "stop" },
  RETURN_REQUESTED: { icon: RotateCcw, effect: "rotate" },
  RETURNED: { icon: PackageOpen, effect: "confirm" },
  RETURN_REJECTED: { icon: CircleMinus, effect: "stop" },
} satisfies Record<OrderStatus, { icon: LucideIcon; effect: StatusEffect }>;

const paymentAppearance = {
  UNPAID: { tone: "pending", icon: Wallet },
  PAID: { tone: "success", icon: BadgeCheck },
  PENDING_REFUND: { tone: "pending", icon: RotateCcw },
  REFUNDED: { tone: "returned", icon: Undo2 },
} satisfies Record<PaymentStatus, StatusAppearance>;

const unknownAppearance = { tone: "neutral", icon: CircleHelp } satisfies StatusAppearance;

interface OrderStatusBadgesProps {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  prominent?: boolean;
}

export function OrderStatusBadges({
  orderStatus,
  paymentStatus,
  prominent = false,
}: OrderStatusBadgesProps) {
  return (
    <div className={prominent ? "grid gap-3 sm:grid-cols-2" : "flex min-w-0 flex-wrap gap-2"}>
      <StatusBadge
        caption="Đơn hàng"
        label={orderStatusLabels[orderStatus] ?? "Chưa rõ"}
        tone={orderStatusTones[orderStatus] ?? "neutral"}
        prominent={prominent}
        {...(orderAppearance[orderStatus] ?? { icon: CircleHelp })}
      />
      <StatusBadge
        caption="Thanh toán"
        label={paymentStatusLabels[paymentStatus] ?? "Chưa rõ"}
        prominent={prominent}
        {...(paymentAppearance[paymentStatus] ?? unknownAppearance)}
      />
    </div>
  );
}
