import { z } from "zod";
import { validateDateRange, vietnamToday } from "../dashboard/dateRange";

export function createReportRangeSchema(today = vietnamToday()) {
  return z.object({
    startDate: z.string(),
    endDate: z.string(),
  }).superRefine((range, context) => {
    const message = validateDateRange(range);
    if (message) {
      context.addIssue({ code: "custom", message, path: ["startDate"] });
    } else if (range.endDate > today) {
      context.addIssue({
        code: "custom",
        message: "Ngày kết thúc không được sau hôm nay (giờ Việt Nam).",
        path: ["endDate"],
      });
    }
  });
}
