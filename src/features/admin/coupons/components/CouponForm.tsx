import { useId, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { DiscountType } from "@/shared/types/enums";
import { couponFormSchema, toCouponRequest, type CouponFormInput } from "../schemas";
import { instantToVietnamInput } from "../time";
import type { AdminCoupon, CouponRequest } from "../types";

interface CouponFormProps {
  coupon?: AdminCoupon;
  disabled: boolean;
  onSave: (payload: CouponRequest) => Promise<void>;
}

export function CouponForm({ coupon, disabled, onSave }: CouponFormProps) {
  const prefix = useId();
  const [values, setValues] = useState<CouponFormInput>(() => ({
    code: coupon?.code ?? "",
    discountType: coupon?.discountType ?? DiscountType.PERCENTAGE,
    discountValue: coupon ? String(coupon.discountValue) : "",
    minOrderValue: coupon ? String(coupon.minOrderValue) : "0",
    usageLimit: coupon ? String(coupon.usageLimit) : "1",
    startDate: coupon ? instantToVietnamInput(coupon.startDate) : "",
    endDate: coupon ? instantToVietnamInput(coupon.endDate) : "",
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof CouponFormInput, string>>>({});

  function update<K extends keyof CouponFormInput>(name: K, value: CouponFormInput[K]) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    const result = couponFormSchema.safeParse(values);
    if (!result.success) {
      const next: Partial<Record<keyof CouponFormInput, string>> = {};
      for (const issue of result.error.issues) {
        const name = issue.path[0] as keyof CouponFormInput;
        next[name] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    const payload = toCouponRequest(result.data);
    if (coupon && values.startDate === instantToVietnamInput(coupon.startDate)) {
      payload.startDate = coupon.startDate;
    }
    if (coupon && values.endDate === instantToVietnamInput(coupon.endDate)) {
      payload.endDate = coupon.endDate;
    }
    await onSave(payload);
  }

  function field(name: Exclude<keyof CouponFormInput, "discountType">, label: string, type = "text") {
    const id = `${prefix}-${name}`;
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-medium">{label}</label>
        <input
          id={id}
          type={type}
          step={type === "datetime-local" ? "0.001" : "any"}
          value={values[name]}
          onChange={(event) => update(name, event.target.value)}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${id}-error` : undefined}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        {errors[name] && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <form noValidate onSubmit={(event) => { void submit(event); }} className="mt-5 space-y-4">
      <p className="text-sm text-muted-foreground">Thời gian bên dưới luôn là giờ Việt Nam (UTC+07:00). Coupon mới được bật sẵn.</p>
      <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
        {field("code", "Mã coupon")}
        <div className="space-y-2">
          <label htmlFor={`${prefix}-type`} className="block text-sm font-medium">Loại giảm giá</label>
          <select
            id={`${prefix}-type`}
            value={values.discountType}
            onChange={(event) => update("discountType", event.target.value as CouponFormInput["discountType"])}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={DiscountType.PERCENTAGE}>Phần trăm (%)</option>
            <option value={DiscountType.FIXED_AMOUNT}>Số tiền (VND)</option>
          </select>
        </div>
        {field("discountValue", values.discountType === DiscountType.PERCENTAGE ? "Giảm (%) — tối đa 100" : "Số tiền giảm (VND)", "number")}
        {field("minOrderValue", "Giá trị đơn tối thiểu (VND)", "number")}
        {field("usageLimit", "Tổng lượt sử dụng cho phép", "number")}
        {coupon && <p className="self-center text-sm">Đã sử dụng: {coupon.usedCount} lượt</p>}
        {field("startDate", "Bắt đầu — giờ VN", "datetime-local")}
        {field("endDate", "Kết thúc — giờ VN", "datetime-local")}
      </fieldset>
      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" disabled={disabled}>{disabled ? "Không thể lưu lúc này" : "Lưu coupon"}</Button>
      </div>
    </form>
  );
}
