import { z } from "zod";

export const processReturnSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("APPROVED") }),
  z.object({
    status: z.literal("REJECTED"),
    rejectReason: z.string().trim().min(1, "Vui lòng nhập lý do từ chối."),
  }),
]);

export type ProcessReturnRequest = z.infer<typeof processReturnSchema>;
