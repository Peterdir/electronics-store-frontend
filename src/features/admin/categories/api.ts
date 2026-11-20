import { api } from "@/shared/api/client";
import type { ID } from "@/shared/types/common";
import { categoryFormSchema, type CategoryFormValues } from "./schemas";
import type { AdminCategoryResponse } from "./types";

export function buildCategoryFormData(values: CategoryFormValues): FormData {
  const payload = categoryFormSchema.parse(values);
  const body = new FormData();
  body.append("name", payload.name);
  body.append("status", payload.status);
  if (payload.image) body.append("image", payload.image);
  return body;
}

export async function getAdminCategories(signal: AbortSignal, authToken: string) {
  const { data } = await api.get<AdminCategoryResponse[]>("/api/categories", {
    signal,
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function createAdminCategory(values: CategoryFormValues, authToken: string) {
  const { data } = await api.post<AdminCategoryResponse>("/api/admin/categories", buildCategoryFormData(values), {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function updateAdminCategory(id: ID, values: CategoryFormValues, authToken: string) {
  const { data } = await api.put<AdminCategoryResponse>(`/api/admin/categories/${id}`, buildCategoryFormData(values), {
    meta: { authToken, noPublicRetry: true },
  });
  return data;
}

export async function deleteAdminCategory(id: ID, authToken: string): Promise<void> {
  await api.delete<void>(`/api/admin/categories/${id}`, {
    meta: { authToken, noPublicRetry: true },
  });
}
