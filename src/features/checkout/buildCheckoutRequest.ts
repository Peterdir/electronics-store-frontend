import { z } from "zod";
import { PaymentMethod } from "@/shared/types/enums";
import type { ShippingMethod } from "./checkoutOptions";
import type { CheckoutAddress, CheckoutRequest, CheckoutSource } from "./types";

interface Input {
  source: CheckoutSource;
  address: CheckoutAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  couponCode: string;
  contactEmail: string;
}

export function buildCheckoutRequest(input: Input): CheckoutRequest {
  if (input.paymentMethod !== PaymentMethod.COD) {
    throw new Error("Phương thức thanh toán này chưa được hỗ trợ.");
  }
  if (input.shippingMethod !== "STANDARD" && input.shippingMethod !== "EXPRESS") {
    throw new Error("Phương thức giao hàng không hợp lệ.");
  }

  const address: CheckoutAddress = input.address.addressId !== undefined
    ? { addressId: input.address.addressId }
    : {
        recipientName: input.address.recipientName.trim(),
        recipientPhone: input.address.recipientPhone.trim(),
        shippingAddress: input.address.shippingAddress.trim(),
      };

  if (address.addressId !== undefined ? !address.addressId.trim() : (
    !address.recipientName || !address.shippingAddress ||
    !/^(0|\+84)[0-9]{9}$/.test(address.recipientPhone)
  )) {
    throw new Error("Vui lòng xác nhận đầy đủ địa chỉ nhận hàng hợp lệ.");
  }

  const directItems = input.source.kind === "userCart"
    ? undefined
    : (input.source.kind === "guestCart" ? input.source.items : [input.source.item])
        .map((item) => ({ ...item }));

  if (directItems && (directItems.length === 0 || directItems.some((item) => (
    !item.productVariantId.trim() || !Number.isSafeInteger(item.quantity) || item.quantity < 1
  )))) {
    throw new Error("Danh sách sản phẩm đặt hàng không hợp lệ.");
  }

  const couponCode = input.couponCode.trim();
  const contactEmail = input.contactEmail.trim();
  if (contactEmail && !z.string().max(254).email().safeParse(contactEmail).success) {
    throw new Error("Email nhận thông tin đơn hàng không hợp lệ.");
  }

  return {
    ...address,
    shippingMethod: input.shippingMethod,
    paymentMethod: input.paymentMethod,
    ...(couponCode ? { couponCode } : {}),
    ...(contactEmail ? { contactEmail } : {}),
    ...(directItems ? { directItems } : {}),
  };
}
