import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/shared/types/enums";
import { orderStatusLabels } from "../orderStatus";

interface OrderStatusTabsProps {
  value: OrderStatus | undefined;
  onChange: (status: OrderStatus | undefined) => void;
}

export function OrderStatusTabs({
  value,
  onChange,
}: OrderStatusTabsProps) {
  return (
    <div
      role="group"
      aria-label="Lọc trạng thái đơn hàng"
      className="flex gap-2 overflow-x-auto pb-2"
    >
      <Button
        type="button"
        variant={value === undefined ? "default" : "outline"}
        aria-pressed={value === undefined}
        onClick={() => onChange(undefined)}
      >
        Tất cả
      </Button>

      {Object.values(OrderStatus).map((status) => (
        <Button
          key={status}
          type="button"
          variant={value === status ? "default" : "outline"}
          aria-pressed={value === status}
          onClick={() => onChange(status)}
        >
          {orderStatusLabels[status]}
        </Button>
      ))}
    </div>
  );
}