import { z } from "zod";

export const reviewReplySchema = z.object({
  replyText: z.string().trim().min(1, "Vui lòng nhập nội dung trả lời."),
});

export type ReviewReplyRequest = z.infer<typeof reviewReplySchema>;
