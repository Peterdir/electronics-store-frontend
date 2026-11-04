import { useId } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Truck, Zap } from "lucide-react";
import { formatVND } from "@/lib/format";
import { PaymentMethod } from "@/shared/types/enums";
import {
  shippingOptions,
  type ShippingMethod,
} from "../checkoutOptions";

interface ShippingMethodSelectorProps {
  value: ShippingMethod;
  onChange: (value: ShippingMethod) => void;
}

export function ShippingMethodSelector({
  value,
  onChange,
}: ShippingMethodSelectorProps) {
  const methods: ShippingMethod[] = ["STANDARD", "EXPRESS"];
  const selectedOption = shippingOptions[value];
  const ShippingIcon = value === "EXPRESS" ? Zap : Truck;

  return (
    <Select.Root<ShippingMethod>
      name="shippingMethod"
      value={value}
      onValueChange={(method) => {
        if (method !== null) onChange(method);
      }}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Select.Label className="text-sm font-medium">
          Phương thức giao hàng
        </Select.Label>

        <Select.Trigger className="group inline-flex min-h-11 w-full max-w-72 items-center gap-2.5 rounded-xl border border-input bg-background px-3 py-2 text-left text-sm shadow-sm outline-none transition-colors hover:border-primary/50 hover:bg-accent/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 data-[popup-open]:border-primary/60 data-[popup-open]:bg-accent/30 sm:w-72 motion-reduce:transition-none">
          <ShippingIcon aria-hidden="true" className="size-4 shrink-0 text-primary" />
          <Select.Value className="min-w-0 flex-1 truncate">
            {selectedOption.label}
          </Select.Value>
          <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium tabular-nums text-primary">
            {formatVND(selectedOption.fee)}
          </span>
          <Select.Icon className="shrink-0 text-muted-foreground transition-transform duration-200 group-data-[popup-open]:rotate-180 motion-reduce:transition-none">
            <ChevronDown aria-hidden="true" className="size-3.5" />
          </Select.Icon>
        </Select.Trigger>
      </div>

      <Select.Portal>
        <Select.Positioner
          align="start"
          sideOffset={8}
          alignItemWithTrigger={false}
          className="z-50"
        >
          <Select.Popup className="w-[var(--anchor-width)] max-w-[var(--available-width)] origin-[var(--transform-origin)] overflow-hidden rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl shadow-black/20 transition-[opacity,transform] duration-150 ease-out data-[starting-style]:-translate-y-1 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:-translate-y-1 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 motion-reduce:transition-none">
            <Select.List>
              {methods.map((method) => {
                const option = shippingOptions[method];
                const OptionIcon = method === "EXPRESS" ? Zap : Truck;

                return (
                  <Select.Item
                    key={method}
                    value={method}
                    label={option.label}
                    className="group flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[selected]:text-primary motion-reduce:transition-none"
                  >
                    <OptionIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-data-[selected]:text-primary" />
                    <Select.ItemText className="min-w-0 flex-1">
                      <span className="block font-medium">
                        {option.label}
                      </span>
                      <span className="block text-xs tabular-nums text-muted-foreground">
                        {formatVND(option.fee)}
                      </span>
                    </Select.ItemText>
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      <Select.ItemIndicator>
                        <Check aria-hidden="true" className="size-4 text-primary" />
                      </Select.ItemIndicator>
                    </span>
                  </Select.Item>
                );
              })}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  const name = useId();

  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-lg font-semibold">
        Phương thức thanh toán
      </legend>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4 has-[:checked]:border-primary">
        <input
          type="radio"
          name={name}
          value={PaymentMethod.COD}
          checked={value === PaymentMethod.COD}
          onChange={() => onChange(PaymentMethod.COD)}
        />

        <span>Thanh toán khi nhận hàng (COD)</span>
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-border p-4 text-muted-foreground">
        <input
          type="radio"
          name={name}
          value={PaymentMethod.VNPAY}
          checked={value === PaymentMethod.VNPAY}
          disabled
        />

        <span>VNPay — sắp hỗ trợ</span>
      </label>
    </fieldset>
  );
}

interface CouponInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CouponInput({
  value,
  onChange,
}: CouponInputProps) {
  const id = useId();

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-medium">
        Mã giảm giá
      </label>

      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        spellCheck={false}
        placeholder="Nhập mã nếu có"
        aria-describedby={`${id}-help`}
        className="form-control"
      />

      <p
        id={`${id}-help`}
        className="text-sm text-muted-foreground"
      >
        Mã sẽ được kiểm tra và áp dụng khi đặt hàng.
        Tổng tạm tính chưa bao gồm giảm giá.
      </p>
    </div>
  );
}
