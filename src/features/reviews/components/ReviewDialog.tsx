import { Dialog } from "@base-ui/react/dialog";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useRef, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { qk } from "@/shared/api/queryKeys";
import { useSession } from "@/shared/auth/session.store";
import { ReviewForm, type ReviewFormProps } from "./ReviewForm";

type Props = ReviewFormProps & {
  open: boolean;
  finalFocus?: RefObject<HTMLButtonElement | null>;
};

export function ReviewDialog({ open, finalFocus, ...props }: Props) {
  const popupRef = useRef<HTMLDivElement>(null);
  const userId = useSession((state) => state.user?.id);
  const queryClient = useQueryClient();
  const mutationKey = props.review
    ? [...qk.reviews, userId, "manage", props.review.id]
    : [...qk.reviews, userId, "create", props.item.orderItemId];
  const busy = useIsMutating({ mutationKey, exact: true }) > 0;

  return (
    <Dialog.Root
      open={open}
      disablePointerDismissal
      onOpenChange={(nextOpen, event) => {
        if (queryClient.isMutating({ mutationKey, exact: true }) > 0) {
          event.cancel();
          return;
        }
        if (!nextOpen) props.onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup
          ref={popupRef}
          finalFocus={finalFocus}
          initialFocus={popupRef}
          aria-busy={busy}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background text-foreground shadow-2xl outline-none sm:max-h-[90dvh]"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold tracking-tight">
                {props.review ? "Chỉnh sửa đánh giá" : "Đánh giá sản phẩm"}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground wrap-anywhere">
                {props.review?.productName ?? props.item?.productName}
              </Dialog.Description>
            </div>
            <Dialog.Close render={<Button type="button" variant="ghost" size="icon" disabled={busy} aria-label="Đóng form đánh giá" />}>
              <X aria-hidden="true" />
            </Dialog.Close>
          </div>
          <ReviewForm {...props} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
