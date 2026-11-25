import { ReviewActionDialog, type ReviewActionProps } from "./ReviewActionDialog";

export function ReviewVisibilityAction(props: ReviewActionProps) {
  return <ReviewActionDialog {...props} action="toggle" />;
}
