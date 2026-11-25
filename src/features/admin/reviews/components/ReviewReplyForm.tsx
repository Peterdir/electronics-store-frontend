import { ReviewActionDialog, type ReviewActionProps } from "./ReviewActionDialog";

export function ReviewReplyForm(props: ReviewActionProps) {
  return <ReviewActionDialog {...props} action="reply" />;
}
