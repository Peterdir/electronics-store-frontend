import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  addressSchema,
  emptyAddressValues,
  type AddressFormValues,
} from "../schemas";
import { AddressGeographyFields } from "./AddressGeographyFields";

interface AddressFormProps {
  initialValues?: AddressFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  serverError?: string | null;
  showDefault?: boolean;
  onSubmit: (values: AddressFormValues) => void | Promise<void>;
  onCancel?: () => void;
  onValuesEdited?: () => void;
}

const fields = [
  {
    name: "fullName",
    label: "Họ và tên",
    type: "text",
    autoComplete: "name",
  },
  {
    name: "phone",
    label: "Số điện thoại",
    type: "tel",
    autoComplete: "tel",
  },
  {
    name: "district",
    label: "Khu vực/quận/huyện",
    type: "text",
    autoComplete: "address-level2",
  },
  {
    name: "specificAddress",
    label: "Số nhà, tên đường",
    type: "text",
    autoComplete: "address-line1",
  },
] as const;

export function AddressForm({
  initialValues = emptyAddressValues,
  submitLabel,
  isSubmitting = false,
  serverError,
  showDefault = false,
  onSubmit,
  onCancel,
  onValuesEdited,
}: AddressFormProps) {
  const idPrefix = useId();

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialValues,
  });

  const busy = isSubmitting || formSubmitting;

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      onChange={onValuesEdited}
      className="space-y-4"
    >
      <fieldset disabled={busy} className="space-y-4">
        {fields.map(({ name, label, type, autoComplete }) => {
          const id = `${idPrefix}-${name}`;
          const error = errors[name];

          return (
            <div key={name} className="space-y-1">
              <label
                htmlFor={id}
                className="block text-sm font-medium"
              >
                {label}
              </label>

              <input
                {...register(name)}
                id={id}
                type={type}
                autoComplete={autoComplete}
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error ? `${id}-error` : undefined
                }
                className="form-control"
              />

              {error && (
                <p
                  id={`${id}-error`}
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {error.message}
                </p>
              )}
            </div>
          );
        })}

        <AddressGeographyFields
          idPrefix={idPrefix}
          control={control}
          register={register}
          setValue={setValue}
          errors={errors}
        />

        {showDefault && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register("isDefault")}
            />
            Đặt làm địa chỉ mặc định
          </label>
        )}

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy} className="min-h-11">
            {busy ? "Đang lưu..." : submitLabel}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={onCancel}
            >
              Hủy
            </Button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
