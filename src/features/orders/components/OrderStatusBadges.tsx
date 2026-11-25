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
  compact?: boolean;
}

export function OrderStatusBadge({ status, compact = false, prominent = false }: {
  status: OrderStatus;
  compact?: boolean;
  prominent?: boolean;
}) {
  return (
    <StatusBadge
      caption="Đơn hàng"
      compact={compact}
      label={orderStatusLabels[status] ?? "Chưa rõ"}
      tone={orderStatusTones[status] ?? "neutral"}
      prominent={prominent}
      {...(orderAppearance[status] ?? { icon: CircleHelp })}
    />
  );
}

export function PaymentStatusBadge({ status, compact = false, prominent = false }: {
  status: PaymentStatus;
  compact?: boolean;
  prominent?: boolean;
}) {
  return (
    <StatusBadge
      caption="Thanh toán"
      compact={compact}
      label={paymentStatusLabels[status] ?? "Chưa rõ"}
      prominent={prominent}
      {...(paymentAppearance[status] ?? unknownAppearance)}
    />
  );
}

export function OrderStatusBadges({
  orderStatus,
  paymentStatus,
  prominent = false,
  compact = false,
}: OrderStatusBadgesProps) {
  return (
    <div className={prominent ? "grid gap-3 sm:grid-cols-2" : "flex min-w-0 flex-wrap gap-2"}>
      <OrderStatusBadge status={orderStatus} compact={compact} prominent={prominent} />
      <PaymentStatusBadge status={paymentStatus} compact={compact} prominent={prominent} />
    </div>
  );
}
