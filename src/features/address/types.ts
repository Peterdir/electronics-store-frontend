import type { ID } from "@/shared/types/common";
import type { AddressFormValues } from "./schemas";

export type AddressRequest = AddressFormValues;

export interface AddressResponse
    extends Omit<AddressRequest, "isDefault"> {
    id: ID;
    isDefault: boolean | null;
}