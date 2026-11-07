import { z } from "zod";
import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";

const paymentResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  orderId: z.string().min(1).optional(),
}).refine((value) => !value.success || Boolean(value.orderId));

export type PaymentResult = z.infer<typeof paymentResultSchema>;

export async function verifyVnpayReturn(search: string) {
  const response = await api.get<unknown>(
    `/api/payments/vnpay/return${search}`,
    {
      headers: { "X-Skip-Auth": "1" },
      meta: { noPublicRetry: true },
    },
  );

  const result = paymentResultSchema.safeParse(response.data);

  if (!result.success) {
    throw new ApiError(
      0,
      "Máy chủ trả về thông tin xác nhận thanh toán không hợp lệ.",
    );
  }

  return result.data;
}