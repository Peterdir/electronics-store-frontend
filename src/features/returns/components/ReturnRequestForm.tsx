import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { createReturnRequestSchema, type ReturnRequestValues } from "../schemas";
import { EvidenceImagesField } from "./EvidenceImagesField";
import { ReturnReasonPicker } from "./ReturnReasonPicker";
import { requiresReturnImages } from "../reasons";

const editableFields = ["quantity", "reason", "description", "images"] as const;
const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm aria-invalid:border-destructive focus-visible:outline-2 focus-visible:outline-ring";

export function ReturnRequestForm({ purchasedQuantity, sending, checking, submit }: {
  purchasedQuantity: number;
  sending: boolean;
  checking: boolean;
  submit: (values: ReturnRequestValues) => Promise<void>;
}) {
  const formId = useId();
  const {
    control,
    handleSubmit,
    register,
    setError,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ReturnRequestValues>({
    resolver: zodResolver(createReturnRequestSchema(purchasedQuantity)),
    defaultValues: { quantity: 1, reason: "", description: "", images: [] },
  });
  const reason = useWatch({ control, name: "reason" });
  const imagesRequired = requiresReturnImages(reason);
  const busy = sending || isSubmitting;

  async function onSubmit(values: ReturnRequestValues) {
    if (checking || sending) return;

    try {
      await submit(values);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError("root.server", { message: "Không gửi được yêu cầu trả hàng." });
        return;
      }
      if ([403, 404, 409].includes(error.status)) return;

      const fieldErrors = editableFields.filter((field) => error.fieldErrors?.[field]);
      for (const field of fieldErrors) {
        setError(field, { type: "server", message: error.fieldErrors?.[field] });
      }
      if (fieldErrors.length) return;

      if (error.status === 413) {
        setError("images", { message: "Yêu cầu vượt giới hạn tải lên của máy chủ. Hãy giảm số ảnh hoặc chọn ảnh nhẹ hơn." });
      } else if (error.status === 400 && /^(Invalid image format|Image file is required|Image size exceeds|Could not read the image file)/.test(error.message)) {
        setError("images", { message: "Máy chủ từ chối tệp ảnh. Hãy chọn ảnh JPG, JPEG, PNG hoặc WebP hợp lệ, tối đa 5 MiB mỗi ảnh." });
      } else if (error.status === 0 || error.status >= 500) {
        setError("root.server", {
          message: "Chưa xác nhận được yêu cầu đã gửi thành công. Hãy liên hệ cửa hàng với mã đơn trước khi gửi lại.",
        });
      } else {
        setError("root.server", { message: error.message });
      }
    }
  }

  return (
    <form
      noValidate
      aria-busy={busy}
      className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6"
      onSubmit={(event) => { void handleSubmit(onSubmit)(event); }}
    >
      <fieldset disabled={sending || checking} className="min-w-0 space-y-5">
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor={`${formId}-quantity`}>Số lượng trả</label>
          <input
            id={`${formId}-quantity`}
            type="number"
            min={1}
            max={purchasedQuantity}
            step={1}
            required
            className={`${inputClass} max-w-28`}
            aria-invalid={Boolean(errors.quantity)}
            aria-describedby={`${formId}-quantity-help`}
            {...register("quantity", { valueAsNumber: true })}
          />
          <p id={`${formId}-quantity-help`} role={errors.quantity ? "alert" : undefined} className={errors.quantity ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
            {errors.quantity?.message ?? `Đã mua ${purchasedQuantity} sản phẩm.`}
          </p>
        </div>

        <Controller
          name="reason"
          control={control}
          render={({ field }) => (
            <ReturnReasonPicker
              id={`${formId}-reason`}
              ref={field.ref}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                void trigger("images");
              }}
              onBlur={field.onBlur}
              disabled={busy || checking}
              error={errors.reason?.message}
            />
          )}
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor={`${formId}-description`}>Mô tả thêm (tùy chọn)</label>
          <textarea
            id={`${formId}-description`}
            rows={3}
            className={inputClass}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? `${formId}-description-error` : undefined}
            {...register("description")}
          />
          {errors.description && <p id={`${formId}-description-error`} role="alert" className="text-sm text-destructive">{errors.description.message}</p>}
        </div>

        <Controller
          name="images"
          control={control}
          render={({ field }) => (
            <EvidenceImagesField
              id={`${formId}-images`}
              ref={field.ref}
              onBlur={field.onBlur}
              files={field.value}
              onChange={field.onChange}
              error={errors.images?.message}
              required={imagesRequired}
            />
          )}
        />
      </fieldset>

      {errors.root?.server?.message && <p role="alert" className="text-sm text-destructive">{errors.root.server.message}</p>}
      <Button type="submit" size="lg" disabled={busy || checking}>
        {busy ? "Đang gửi…" : "Gửi yêu cầu trả hàng"}
      </Button>
    </form>
  );
}
