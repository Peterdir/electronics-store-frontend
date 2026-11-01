import { api } from "@/shared/api/client";
import type { ID, MessageResponse } from "@/shared/types/common";
import type { AddressRequest, AddressResponse } from "./types";

export async function getAddresses(signal?: AbortSignal) {
  const response = await api.get<AddressResponse[]>(
    "/api/addresses",
    { signal },
  );
  return response.data;
}

export async function createAddress(payload: AddressRequest) {
  const response = await api.post<MessageResponse>(
    "/api/addresses",
    payload,
  );
  return response.data;
}

export async function updateAddress({
  id,
  payload,
}: {
  id: ID;
  payload: AddressRequest;
}) {
  const response = await api.put<MessageResponse>(
    `/api/addresses/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteAddress(id: ID) {
  const response = await api.delete<MessageResponse>(
    `/api/addresses/${id}`,
  );
  return response.data;
}

export async function setDefaultAddress(id: ID) {
  const response = await api.patch<MessageResponse>(
    `/api/addresses/${id}/default`,
  );
  return response.data;
}