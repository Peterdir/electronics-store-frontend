const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;

export function vietnamTimeToInstant(value: string): string | null {
  if (!LOCAL_DATETIME.test(value)) return null;
  const timestamp = Date.parse(`${value}+07:00`);
  if (!Number.isFinite(timestamp)) return null;
  if (instantToVietnamInput(new Date(timestamp).toISOString()).slice(0, 16) !== value.slice(0, 16)) return null;
  return new Date(timestamp).toISOString();
}

export function instantToVietnamInput(instant: string): string {
  const timestamp = Date.parse(instant);
  if (!Number.isFinite(timestamp)) return "";
  return new Date(timestamp + VIETNAM_OFFSET_MS).toISOString().slice(0, 23);
}

export function formatCouponTime(instant: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(instant));
}
