import { useEffect, useId, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { useSession } from "@/shared/auth/session.store";
import { isCurrentReviewSession, useCreateReview } from "../queries";
import { reviewImageAccept, reviewImageSchema, reviewSchema, type ReviewValues } from "../schemas";
import type { CreateReviewRequest, PendingReview } from "../types";

const scores = [1, 2, 3, 4, 5];

export function ReviewForm({ item, canSubmit, onClose }: {
  item: PendingReview;
  canSubmit: boolean;
  onClose: () => void;
}) {
  const fieldId = useId();
  const imageInput = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const userId = useSession((state) => state.user?.id);
  const queryClient = useQueryClient();
  const { mutation, mutationKey } = useCreateReview(userId, item.orderItemId);
  const submitting = useIsMutating({ mutationKey, exact: true }) > 0;
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, reviewText: "", image: null },
  });
  const selectedImage = useWatch({ control, name: "image" });

  useEffect(() => {
    if (previewUrl) return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectImage(image: File | null) {
    setValue("image", image, { shouldValidate: true });
    setPreviewUrl(image && reviewImageSchema.safeParse(image).success
      ? URL.createObjectURL(image)
      : undefined);
  }

  function removeImage() {
    selectImage(null);
    if (imageInput.current) {
      imageInput.current.value = "";
      imageInput.current.focus();
    }
  }

  function submit(values: ReviewValues) {
    if (!canSubmit || queryClient.isMutating({ mutationKey, exact: true }) > 0) return;

    const { token } = useSession.getState();
    if (!userId || !token || !isCurrentReviewSession({ userId, token })) {
      setError("root.server", { message: "Phiên đăng nhập đã thay đổi." });
      return;
    }

    const session = { userId, token };
    const payload: CreateReviewRequest = {
      rating: values.rating,
      orderItemId: item.orderItemId,
      productId: item.productId,
      ...(item.productVariantId != null && { productVariantId: item.productVariantId }),
      ...(values.reviewText && { reviewText: values.reviewText }),
    };

    mutation.mutate({ ...session, payload, image: values.image ?? undefined }, {
      onSuccess: () => {
        if (isCurrentReviewSession(session)) onClose();
      },
      onError: (error) => {
        if (!isCurrentReviewSession(session)) return;

        if (error instanceof ApiError) {
          const { rating, reviewText } = error.fieldErrors ?? {};
          if (rating) setError("rating", { type: "server", message: rating });
          if (reviewText) setError("reviewText", { type: "server", message: reviewText });
          if (rating || reviewText) return;

          if (error.status === 400 &&
              error.message.startsWith("Your review contains inappropriate content or links.")) {
            setError("reviewText", {
              type: "server",
              message: "Nội dung có từ hoặc đường dẫn không được phép.",
            });
            return;
          }

          if (error.status === 413 && values.image) {
            setError("image", {
              type: "server",
              message: "Yêu cầu vượt giới hạn tải lên. Hãy chọn ảnh nhỏ hơn.",
            });
            return;
          }
          if (error.status === 400 && error.message.startsWith("Invalid image format.")) {
            setError("image", { type: "server", message: "Tệp đã chọn không phải ảnh JPG, PNG hoặc WebP hợp lệ." });
            return;
          }
          if (error.status === 409 || error.status === 404) return;
          if (error.status === 0 || error.status >= 500) {
            setError("root.server", {
              message: "Chưa xác nhận được kết quả gửi. Hãy kiểm tra tab Đã đánh giá trước khi gửi lại.",
            });
            return;
          }
        }

        setError("root.server", {
          message: error instanceof ApiError ? error.message : "Không gửi được đánh giá.",
        });
      },
    });
  }

  return (
    <form
      className="space-y-3 border-t border-border pt-3"
      onSubmit={(event) => { void handleSubmit(submit)(event); }}
    >
      <fieldset disabled={submitting}>
        <legend className="text-sm font-medium">Số sao</legend>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <div className="mt-2 flex flex-wrap gap-3">
              {scores.map((score) => (
                <label key={score} className="inline-flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    name={`${fieldId}-rating`}
                    checked={field.value === score}
                    onChange={() => field.onChange(score)}
                    onBlur={field.onBlur}
                    ref={score === 1 ? field.ref : undefined}
                    aria-invalid={Boolean(errors.rating)}
                    aria-describedby={errors.rating ? `${fieldId}-rating-error` : undefined}
                  />
                  {score} sao
                </label>
              ))}
            </div>
          )}
        />
        {errors.rating && (
          <p id={`${fieldId}-rating-error`} role="alert" className="text-sm text-destructive">
            {errors.rating.message}
          </p>
        )}
      </fieldset>

      <div className="space-y-1">
        <label htmlFor={fieldId} className="text-sm font-medium">Nội dung (tùy chọn)</label>
        <textarea
          id={fieldId}
          rows={3}
          readOnly={submitting}
          aria-invalid={Boolean(errors.reviewText)}
          aria-describedby={errors.reviewText ? `${fieldId}-text-error` : undefined}
          className="block w-full rounded-lg border border-border bg-background p-2"
          {...register("reviewText")}
        />
        {errors.reviewText && (
          <p id={`${fieldId}-text-error`} role="alert" className="text-sm text-destructive">
            {errors.reviewText.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={`${fieldId}-image`} className="block text-sm font-medium">
          Ảnh đánh giá (tùy chọn)
        </label>
        <p id={`${fieldId}-image-help`} className="text-sm text-muted-foreground">
          Một ảnh JPG, PNG hoặc WebP, tối đa 5 MiB.
        </p>
        <input
          id={`${fieldId}-image`}
          ref={imageInput}
          type="file"
          accept={reviewImageAccept}
          disabled={submitting}
          aria-invalid={Boolean(errors.image)}
          aria-describedby={`${fieldId}-image-help${errors.image ? ` ${fieldId}-image-error` : ""}`}
          onChange={(event) => selectImage(event.currentTarget.files?.[0] ?? null)}
          className="block w-full rounded-lg border border-border bg-background text-sm file:mr-3 file:border-0 file:bg-muted file:px-3 file:py-2 file:font-medium disabled:opacity-50"
        />
        {errors.image && (
          <p id={`${fieldId}-image-error`} role="alert" className="text-sm text-destructive">
            {errors.image.message}
          </p>
        )}
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Xem trước ảnh đánh giá"
            className="max-h-40 max-w-full rounded-lg border border-border object-contain"
          />
        )}
        {selectedImage && (
          <Button type="button" variant="outline" disabled={submitting} onClick={removeImage}>
            Bỏ ảnh
          </Button>
        )}
      </div>

      {errors.root?.server?.message && (
        <p role="alert" className="text-sm text-destructive">{errors.root.server.message}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting || !canSubmit}>
          {submitting ? "Đang gửi…" : "Gửi đánh giá"}
        </Button>
        <Button type="button" variant="outline" disabled={submitting} onClick={onClose}>
          Đóng
        </Button>
      </div>
    </form>
  );
}
