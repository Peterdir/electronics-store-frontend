import { useId } from "react";
import { useFormContext, type FieldPath } from "react-hook-form";
import type { ProductFormValues } from "../schemas";

interface ProductFieldProps {
  name: FieldPath<ProductFormValues>;
  label: string;
  required?: boolean;
  kind?: "text" | "textarea" | "select";
  inputMode?: "decimal" | "numeric";
  options?: { value: string; label: string }[];
  disabled?: boolean;
}

export function ProductField({ name, label, required, kind = "text", inputMode, options, disabled }: ProductFieldProps) {
  const id = useId();
  const { register, getFieldState, formState } = useFormContext<ProductFormValues>();
  const { error } = getFieldState(name, formState);
  const props = {
    ...register(name), id, required, disabled,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
    className: "w-full min-w-0 rounded-lg border border-input bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring",
  };
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">{label}{required ? " *" : ""}</label>
      {kind === "textarea" ? <textarea {...props} rows={5} /> : kind === "select" ? (
        <select {...props}>{options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      ) : <input {...props} type="text" inputMode={inputMode} />}
      {error?.message && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}
