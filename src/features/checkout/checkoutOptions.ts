export type ShippingMethod = "STANDARD" | "EXPRESS";

export const shippingOptions: Record<
  ShippingMethod,
  { label: string; fee: number }
> = {
  STANDARD: {
    label: "Giao hàng tiêu chuẩn",
    fee: 30_000,
  },
  EXPRESS: {
    label: "Giao hàng nhanh",
    fee: 55_000,
  },
};