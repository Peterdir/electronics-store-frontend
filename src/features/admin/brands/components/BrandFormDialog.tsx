import { useId, useRef } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { ImageDropzone } from "@/shared/components/ImageDropzone";
import {
  isBrandResultUncertain, isCurrentBrandSession, useBrandMutation,
  type BrandSession,
} from "../queries";
import { createBrandSchema, getBrandFormSchema, type BrandFormValues } from "../schemas";
import type { AdminBrandResponse } from "../types";

interface BrandFormDialogProps {
  brand?: AdminBrandResponse;
  session: BrandSession;
  onClose: () => void;
}

const inputClassName = "w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring";

export function BrandFormDialog({ brand, session, onClose }: BrandFormDialogProps) {
  const id = useId();
  const submitting = useRef(false);
  const mutation = useBrandMutation();
  const {
    register, control, handleSubmit, clearErrors, setError,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(getBrandFormSchema(Boolean(brand))),
    defaultValues: { name: brand?.name ?? "", status: brand?.status ?? "ACTIVE", logo: undefined },
  });
  const busy = mutation.isPending || isSubmitting;
  const uncertain = isBrandResultUncertain(mutation.error);
  const forbidden = mutation.error instanceof ApiError && mutation.error.status === 403;
  const missing = mutation.error instanceof ApiError && mutation.error.status === 404;
  const sameSession = isCurrentBrandSession(session);

  async function submit(values: BrandFormValues) {
    if (submitting.current || mutation.isPending || uncertain || forbidden || missing || !isCurrentBrandSession(session)) return;
    submitting.current = true;
    clearErrors();
    try {
      await mutation.mutateAsync(brand
        ? { kind: "update", id: brand.id, values, session }
        : { kind: "create", values: createBrandSchema.parse(values), session });
      if (isCurrentBrandSession(session)) onClose();
    } catch (error) {
      if (!isCurrentBrandSession(session)) return;
      if (error instanceof ApiError) {
        for (const field of ["name", "status", "logo"] as const) {
          const message = error.fieldErrors?.[field];
          if (message) setError(field, { type: "server", message });
        }
      }
      setError("root.server", { message: error instanceof Error ? error.message : "Không thể lưu thương hiệu." });
    } finally {
      submitting.current = false;
    }
  }

  return (
    <Dialog.Root
      open={sameSession}
      disablePointerDismissal
      onOpenChange={(open, event) => {
        if (busy || submitting.current) { event.cancel(); return; }
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl sm:p-6">
          <Dialog.Title className="text-lg font-semibold">{brand ? "Sửa thương hiệu" : "Tạo thương hiệu"}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Nhập tên, trạng thái và logo. {brand ? "Logo hiện tại được giữ nếu bạn không chọn file mới." : "Bắt buộc chọn logo khi tạo thương hiệu."}
          </Dialog.Description>
          <form noValidate aria-busy={busy} className="mt-4 space-y-4" onSubmit={(event) => { void handleSubmit(submit)(event); }}>
            <fieldset disabled={busy || forbidden || missing} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor={`${id}-name`} className="block text-sm font-medium">Tên thương hiệu *</label>
                <input
                  {...register("name")}
                  id={`${id}-name`}
                  required
                  className={inputClassName}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? `${id}-name-error` : undefined}
                />
                {errors.name && <p id={`${id}-name-error`} role="alert" className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor={`${id}-status`} className="block text-sm font-medium">Trạng thái</label>
                <select
                  {...register("status")}
                  id={`${id}-status`}
                  className={inputClassName}
                  aria-invalid={Boolean(errors.status)}
                  aria-describedby={errors.status ? `${id}-status-error` : undefined}
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Ngừng hoạt động</option>
                </select>
                {errors.status && <p id={`${id}-status-error`} role="alert" className="text-sm text-destructive">{errors.status.message}</p>}
              </div>
              <Controller
                name="logo"
                control={control}
                render={({ field, fieldState }) => (
                  <ImageDropzone
                    id={`${id}-logo`}
                    label="Logo thương hiệu"
                    required={!brand}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    file={field.value}
                    existingImageUrl={brand?.logo}
                    disabled={busy || forbidden || missing}
                    error={fieldState.error?.message}
                    onChange={field.onChange}
                  />
                )}
              />
            </fieldset>
            {errors.root?.server && <p role="alert" className="text-sm text-destructive">{errors.root.server.message}</p>}
            {uncertain && <p role="alert" className="text-sm text-destructive">Chưa xác nhận được kết quả. Hãy đóng và kiểm tra danh sách trước khi thực hiện lại để tránh lưu trùng.</p>}
            {forbidden && <p role="alert" className="text-sm text-destructive">Máy chủ từ chối quyền. Vui lòng đăng nhập lại để cập nhật phiên.</p>}
            {missing && <p role="alert" className="text-sm text-destructive">Thương hiệu không còn tồn tại. Hãy đóng và kiểm tra danh sách mới.</p>}
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Dialog.Close render={<Button type="button" variant="outline" disabled={busy} />}>Đóng</Dialog.Close>
              <Button type="submit" disabled={busy || uncertain || forbidden || missing}>
                {busy ? "Đang lưu…" : "Lưu thương hiệu"}
              </Button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
