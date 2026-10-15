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