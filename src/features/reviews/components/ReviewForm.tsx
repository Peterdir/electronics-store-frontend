import { useEffect, useId, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMutating, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ImagePlus, LoaderCircle, Send, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { useSession } from "@/shared/auth/session.store";
import { isCurrentReviewSession, useCreateReview, useManageReview } from "../queries";
import { reviewImageAccept, reviewImageSchema, reviewSchema, type ReviewValues } from "../schemas";
import type { CreateReviewRequest, PendingReview, ReviewResponse } from "../types";
import { ReviewAttachment } from "./ReviewCards";

const scores = [1, 2, 3, 4, 5];
const ratingLabels = ["Chọn số sao để đánh giá", "Rất không hài lòng", "Không hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"];

export type ReviewFormProps = {
  canSubmit: boolean;
  onClose: () => void;
} & ({ item: PendingReview; review?: never } | { review: ReviewResponse; item?: never });

export function ReviewForm({ item, review, canSubmit, onClose }: ReviewFormProps) {
  const fieldId = useId();
  const imageInput = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [hoveredRating, setHoveredRating] = useState(0);
  const userId = useSession((state) => state.user?.id);
  const queryClient = useQueryClient();
  const create = useCreateReview(userId, item?.orderItemId ?? "");
  const manage = useManageReview(userId, review?.id ?? "");
  const mutationKey = review ? manage.mutationKey : create.mutationKey;
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
    defaultValues: {
      rating: review?.rating ?? 0,
      reviewText: review?.reviewText ?? "",
      image: null,
      removeImage: false,
    },
  });
  const selectedImage = useWatch({ control, name: "image" });
  const removingImage = useWatch({ control, name: "removeImage" });

  useEffect(() => {
    if (previewUrl) return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function selectImage(image: File | null) {
    if (image) setValue("removeImage", false);
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
    const callbacks = {
      onSuccess: () => {
        if (isCurrentReviewSession(session)) onClose();
      },
      onError: (error: Error) => {
        if (!isCurrentReviewSession(session)) return;

        if (error instanceof ApiError) {
          const { rating, reviewText, image, removeImage } = error.fieldErrors ?? {};
          if (rating) setError("rating", { type: "server", message: rating });
          if (reviewText) setError("reviewText", { type: "server", message: reviewText });
          if (image || removeImage) {
            setError("image", { type: "server", message: image || removeImage });
          }
          if (rating || reviewText || image || removeImage) return;

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
          if (error.status === 404) return;
          if (!review && error.status === 409) return;
          if (error.status === 0 || error.status >= 500) {
            setError("root.server", {
              message: "Chưa xác nhận được kết quả. Hãy đóng form và tải lại danh sách trước khi thử lại.",
            });
            return;
          }
        }

        setError("root.server", {
          message: error instanceof ApiError ? error.message : "Không gửi được đánh giá.",
        });
      },
    };

    if (review) {
      manage.mutation.mutate({
        ...session,
        action: "update",
        payload: {
          rating: values.rating,
          reviewText: values.reviewText,
          removeImage: values.removeImage,
        },
        image: values.image ?? undefined,
      }, callbacks);
    } else {
      const payload: CreateReviewRequest = {
        rating: values.rating,
        orderItemId: item.orderItemId,
        productId: item.productId,
        ...(item.productVariantId != null && { productVariantId: item.productVariantId }),
        ...(values.reviewText && { reviewText: values.reviewText }),
      };
      create.mutation.mutate({ ...session, payload, image: values.image ?? undefined }, callbacks);
    }
  }

  return (
    <form
      className="flex min-h-0 flex-col"
      aria-busy={submitting}
      onSubmit={(event) => { void handleSubmit(submit)(event); }}
    >
      <div className="min-h-0 space-y-6 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <fieldset disabled={submitting} className="min-w-0 rounded-xl bg-muted/60 px-3 pb-5 text-center sm:px-5">
          <legend className="mx-auto px-2 pt-4 text-sm font-medium">Bạn thấy sản phẩm thế nào?</legend>
          <Controller
            control={control}
            name="rating"
            render={({ field }) => (
              <div className="mt-3">
                <div
                  className="mx-auto flex w-fit gap-1 sm:gap-2"
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  {scores.map((score) => (
                    <label
                      key={score}
                      className="group relative cursor-pointer rounded-xl has-disabled:cursor-wait"
                      onMouseEnter={() => { if (!submitting) setHoveredRating(score); }}
                    >
                      <input
                        type="radio"
                        value={score}
                        className="peer sr-only"
                        name={`${fieldId}-rating`}
                        aria-label={`${score} sao — ${ratingLabels[score]}`}
                        checked={field.value === score}
                        onChange={() => field.onChange(score)}
                        onBlur={field.onBlur}
                        ref={score === 1 ? field.ref : undefined}
                        aria-invalid={Boolean(errors.rating)}
                        aria-describedby={errors.rating ? `${fieldId}-rating-error` : undefined}
                      />
                      <span className="flex size-11 items-center justify-center rounded-xl transition-colors group-hover:bg-background/80 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:opacity-50 sm:size-12">
                        <Star
                          aria-hidden="true"
                          strokeWidth={1.5}
                          className={`size-8 transition-[color,fill,transform] duration-150 motion-reduce:transition-none sm:size-9 ${score <= (hoveredRating || field.value)
                            ? "fill-amber-400 text-amber-500 dark:text-amber-400"
                            : "fill-transparent text-muted-foreground/50"} ${hoveredRating === score ? "motion-safe:scale-110" : ""}`}
                        />
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-sm font-medium text-foreground" aria-live="polite">
                  {ratingLabels[hoveredRating || field.value]}
                  {field.value > 0 && (
                    <span className="ml-2 font-normal text-muted-foreground">{field.value}/5</span>
                  )}
                </p>
              </div>
            )}
          />
          {errors.rating && (
            <p id={`${fieldId}-rating-error`} role="alert" className="text-sm text-destructive">
              {errors.rating.message}
            </p>
          )}
        </fieldset>

        <div className="space-y-2">
          <label htmlFor={fieldId} className="text-sm font-semibold">
            Chia sẻ trải nghiệm <span className="font-normal text-muted-foreground">(tùy chọn)</span>
          </label>
          <textarea
            id={fieldId}
            rows={5}
            placeholder="Sản phẩm có đáp ứng mong đợi của bạn? Chia sẻ về chất lượng, tính năng hoặc trải nghiệm sử dụng…"
            readOnly={submitting}
            aria-invalid={Boolean(errors.reviewText)}
            aria-describedby={errors.reviewText ? `${fieldId}-text-error` : undefined}
            className="block min-h-32 w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-sm leading-6 transition-shadow outline-none placeholder:text-muted-foreground/75 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20 read-only:opacity-60"
            {...register("reviewText")}
          />
          {errors.reviewText && (
            <p id={`${fieldId}-text-error`} role="alert" className="text-sm text-destructive">
              {errors.reviewText.message}
            </p>
          )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <p id={`${fieldId}-image-label`} className="text-sm font-semibold">
            Ảnh đánh giá <span className="font-normal text-muted-foreground">(tùy chọn)</span>
          </p>
          <p id={`${fieldId}-image-help`} className="text-xs leading-5 text-muted-foreground">
            Một ảnh JPG, PNG hoặc WebP, tối đa 5 MiB.
          </p>
        </div>
        <label
          htmlFor={`${fieldId}-image`}
          className={`group flex min-h-28 items-center gap-4 rounded-xl border border-dashed px-4 py-5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20 ${errors.image ? "border-destructive" : "border-input"} ${submitting ? "cursor-wait opacity-60" : "cursor-pointer hover:border-primary/60 hover:bg-primary/5"}`}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            <ImagePlus aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0 space-y-1">
            <span className="block text-sm font-medium">{selectedImage || review?.imageUrl ? "Chọn ảnh thay thế" : "Thêm ảnh sản phẩm"}</span>
            <span className="block text-xs leading-5 text-muted-foreground">Nhấn để chọn ảnh từ thiết bị</span>
          </span>
          <input
            id={`${fieldId}-image`}
            ref={imageInput}
            type="file"
            aria-labelledby={`${fieldId}-image-label`}
            accept={reviewImageAccept}
            disabled={submitting}
            aria-invalid={Boolean(errors.image)}
            aria-describedby={`${fieldId}-image-help${errors.image ? ` ${fieldId}-image-error` : ""}`}
            onChange={(event) => selectImage(event.currentTarget.files?.[0] ?? null)}
            className="sr-only"
          />
        </label>
        {errors.image && (
          <p id={`${fieldId}-image-error`} role="alert" className="text-sm text-destructive">
            {errors.image.message}
          </p>
        )}
        {selectedImage && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            {previewUrl && (
              <img src={previewUrl} alt="Xem trước ảnh đánh giá" className="size-16 shrink-0 rounded-lg bg-muted object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{selectedImage.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{Math.ceil(selectedImage.size / 1024)} KB</p>
            </div>
            <Button type="button" size="icon" variant="ghost" aria-label="Bỏ ảnh đã chọn" disabled={submitting} onClick={removeImage}>
              <X aria-hidden="true" />
            </Button>
          </div>
        )}
        {review?.imageUrl && !selectedImage && (
          <div className="space-y-3 rounded-xl border border-border bg-card p-3">
            {!removingImage && <ReviewAttachment key={review.imageUrl} url={review.imageUrl} />}
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" className="size-4 accent-primary" disabled={submitting} {...register("removeImage")} />
              Gỡ ảnh hiện tại khi lưu
            </label>
          </div>
        )}
      </div>

      {errors.root?.server?.message && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{errors.root.server.message}</p>
      )}

      </div>
      <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-background p-4 sm:flex-row-reverse sm:items-center sm:gap-3 sm:px-6">
        <Button type="submit" className="h-11 gap-2 px-5 sm:min-w-40" disabled={submitting || !canSubmit}>
          {submitting ? <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" /> : <Send aria-hidden="true" />}
          {submitting ? "Đang lưu…" : review ? "Lưu thay đổi" : "Gửi đánh giá"}
        </Button>
        <Button type="button" variant="ghost" className="h-11 px-5" disabled={submitting} onClick={onClose}>
          Đóng
        </Button>
      </div>
    </form>
  );
}
