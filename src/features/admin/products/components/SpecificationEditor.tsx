import { useFieldArray, useFormContext } from "react-hook-form";
import type { ProductFormValues } from "../schemas";
import { ProductField } from "./ProductField";
import { SpecificationEditorLayout } from "./SpecificationEditorLayout";

interface SpecificationEditorProps {
  name: "specification" | `variants.${number}.attributes`;
  title: string;
}

export function SpecificationEditor({ name, title }: SpecificationEditorProps) {
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <SpecificationEditorLayout title={title} rowIds={fields.map((row) => row.id)} onAdd={() => append({ key: "", value: "" })} onRemove={remove} renderFields={(index) => ({
      name: <ProductField name={`${name}.${index}.key`} label={`Tên ${index + 1}`} placeholder={name === "specification" ? "Ví dụ: RAM" : "Ví dụ: Màu sắc"} required />,
      value: <ProductField name={`${name}.${index}.value`} label={`Giá trị ${index + 1}`} placeholder={name === "specification" ? "Ví dụ: 16 GB" : "Ví dụ: Đen"} required />,
    })} />
  );
}
