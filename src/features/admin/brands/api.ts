import { api } from "@/shared/api/client";
import type { ID } from "@/shared/types/common";
import { createBrandSchema, updateBrandSchema, type BrandFormValues, type CreateBrandValues } from "./schemas";
import type { AdminBrandResponse } from "./types";

export function buildBrandFormData(values: BrandFormValues, mode: "create" | "update"): FormData {
  const payload = (mode === "create" ? createBrandSchema : updateBrandSchema).parse(values);
  const body = new FormData();
  body.append("name", payload.name);
  body.append("status", payload.status);
  if (payload.logo) body.append("logo", payload.logo);
  return body;
}

export async function getAdminBrands(signal: AbortSignal, authToken: string) {
  const { data } = await api.get<AdminBrandResponse[]>("/api/brands", {
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function createAdminBrand(values: CreateBrandValues, authToken: string) {
  const { data } = await api.post<AdminBrandResponse>("/api/admin/brands", buildBrandFormData(values, "create"), {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function updateAdminBrand(id: ID, values: BrandFormValues, authToken: string) {
  const { data } = await api.put<AdminBrandResponse>(`/api/admin/brands/${id}`, buildBrandFormData(values, "update"), {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function deleteAdminBrand(id: ID, authToken: string): Promise<void> {
  await api.delete<void>(`/api/admin/brands/${id}`, {
    meta: { authToken, noPublicRetry: true },
  });
}
