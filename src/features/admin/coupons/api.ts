import { z } from "zod";
import { api } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { isPositiveLongId } from "@/shared/types/common";
import { adminCouponSchema } from "./schemas";
import type { CouponRequest } from "./types";

const endpoint = "/api/admin/coupons";

export async function getAdminCoupons(signal: AbortSignal, authToken: string) {
  const { data } = await api.get<unknown>(endpoint, { signal, meta: { authToken, noPublicRetry: true } });
  const parsed = z.array(adminCouponSchema).safeParse(data);
  if (!parsed.success) throw new ApiError(0, "Dữ liệu coupon không đúng contract. Nhấn F5; nếu vẫn lỗi, kiểm tra JSON active.");
  return parsed.data;
}

export async function saveAdminCoupon(payload: CouponRequest, authToken: string, id?: string) {
  if (id !== undefined && !isPositiveLongId(id)) throw new ApiError(400, "Mã coupon không hợp lệ.");
  const config = { meta: { authToken, noPublicRetry: true } };
  const { data } = id === undefined
    ? await api.post<unknown>(endpoint, payload, config)
    : await api.put<unknown>(`${endpoint}/${id}`, payload, config);
  const parsed = adminCouponSchema.safeParse(data);
  if (!parsed.success || (id !== undefined && parsed.data.id !== id)) {
    throw new ApiError(0, "Máy chủ đã nhận yêu cầu nhưng chưa xác nhận được dữ liệu lưu.");
  }
  return parsed.data;
}

export async function toggleAdminCoupon(id: string, authToken: string) {
  if (!isPositiveLongId(id)) throw new ApiError(400, "Mã coupon không hợp lệ.");
  const { data } = await api.put<string>(`${endpoint}/${id}/toggle-status`, undefined, {
    responseType: "text",
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}
