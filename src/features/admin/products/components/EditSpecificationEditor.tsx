import { useFieldArray, useFormContext } from "react-hook-form";
import type { EditProductFormValues } from "../editProduct";
import { ProductField } from "./ProductField";
import { SpecificationEditorLayout } from "./SpecificationEditorLayout";

export function EditSpecificationEditor() {
  const { control } = useFormContext<EditProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "specification" });
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6">
      <SpecificationEditorLayout title="Thông số kỹ thuật" rowIds={fields.map((row) => row.id)} onAdd={() => append({ key: "", value: "" })} onRemove={remove} renderFields={(index) => ({
        name: <ProductField<EditProductFormValues> name={`specification.${index}.key`} label={`Tên thông số ${index + 1}`} placeholder="Ví dụ: RAM" required />,
        value: <ProductField<EditProductFormValues> name={`specification.${index}.value`} label={`Giá trị ${index + 1}`} kind="textarea" rows={1} placeholder="Ví dụ: 16 GB" />,
      })} />
    </div>
  );
}
