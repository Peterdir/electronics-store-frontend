export type ID = string;
export type ISODateTime = string; // Sử dụng cho Instant
export type ISODate = string; // Sử dụng cho LocalDate
export type Money = number;

export type Attributes = Record<string, string | number | boolean>;

export interface MessageResponse {
    message: string;
}

export interface PageParams {
  page?: number;
  size?: number;
}

export interface Page<T> {
    items: T[];
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
}

const MAX_LONG_ID = "9223372036854775807";

export function isPositiveLongId(value: string | undefined): value is ID {
  if (!value || !/^[1-9]\d*$/.test(value)) {
    return false;
  }

  return (
    value.length < MAX_LONG_ID.length ||
    (value.length === MAX_LONG_ID.length && value <= MAX_LONG_ID)
  );
}