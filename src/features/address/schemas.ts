import { z } from "zod";

const requiredText = (label: string) =>
  z.string().trim().min(1, `Vui lòng nhập ${label}.`);

export const addressSchema = z.object({
  fullName: requiredText("họ tên"),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[0-9]{9}$/, "Số điện thoại không hợp lệ."),
  province: requiredText("tỉnh/thành phố"),
  district: requiredText("khu vực/quận/huyện"),
  ward: requiredText("xã/phường"),
  specificAddress: requiredText("địa chỉ cụ thể"),
  isDefault: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

export const emptyAddressValues: AddressFormValues = {
  fullName: "",
  phone: "",
  province: "",
  district: "",
  ward: "",
  specificAddress: "",
  isDefault: false,
};

export function toAddressRequest(values: AddressFormValues) {
  return { ...values };
}

export function toManualCheckoutAddress(
  values: AddressFormValues,
) {
  return {
    recipientName: values.fullName,
    recipientPhone: values.phone,
    shippingAddress: [
      values.specificAddress,
      values.ward,
      values.district,
      values.province,
    ].join(", "),
  };
}