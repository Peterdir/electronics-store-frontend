import { api } from "@/shared/api/client";
import type { CreateReturnRequest, ReturnRequestResponse } from "./types";

export async function createReturnRequest(payload: CreateReturnRequest, authToken: string) {
  const body = new FormData();
  body.append("orderItemId", payload.orderItemId);
  body.append("quantity", String(payload.quantity));
  body.append("reason", payload.reason);
  if (payload.description) body.append("description", payload.description);
  for (const image of payload.images) body.append("images", image);

  const { data } = await api.post<ReturnRequestResponse>("/api/return-requests", body, {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}
