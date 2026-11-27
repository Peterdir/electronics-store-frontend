import type { DateRange } from "./types";

const DAY_MS = 86_400_000;
export type DatePreset = "7days" | "30days" | "month";

function dateTimestamp(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return NaN;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : NaN;
}

export function validateDateRange(range: DateRange): string | null {
  const start = dateTimestamp(range.startDate);
  const end = dateTimestamp(range.endDate);

  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Vui lòng nhập ngày hợp lệ theo định dạng yyyy-MM-dd.";
  if (start > end) return "Ngày bắt đầu không được sau ngày kết thúc.";
  if ((end - start) / DAY_MS > 365) return "Chênh lệch ngày không được vượt quá 365 ngày.";
  return null;
}

export function vietnamToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function presetDateRange(preset: DatePreset, today = vietnamToday()): DateRange {
  const end = dateTimestamp(today);
  if (!Number.isFinite(end)) throw new Error("Ngày hiện tại không hợp lệ.");

  const startDate = preset === "month"
    ? `${today.slice(0, 7)}-01`
    : new Date(end - (preset === "7days" ? 6 : 29) * DAY_MS).toISOString().slice(0, 10);

  return { startDate, endDate: today };
}

export function parseDateRange(params: URLSearchParams, today = vietnamToday()): DateRange {
  if (!params.has("startDate") && !params.has("endDate")) return presetDateRange("30days", today);
  return { startDate: params.get("startDate") ?? "", endDate: params.get("endDate") ?? "" };
}

export function serializeDateRange(range: DateRange): URLSearchParams {
  return new URLSearchParams({ startDate: range.startDate, endDate: range.endDate });
}
