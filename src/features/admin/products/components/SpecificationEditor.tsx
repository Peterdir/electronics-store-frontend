import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { ProductFormValues } from "../schemas";
import { ProductField } from "./ProductField";

interface SpecificationEditorProps {
  name: "specification" | `variants.${number}.attributes`;
  title: string;
}

export function SpecificationEditor({ name, title }: SpecificationEditorProps) {
  const { control } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="mb-3 font-medium">{title}</legend>
      <p className="text-sm text-muted-foreground">Mỗi tên chỉ xuất hiện một lần. Giá trị được gửi dưới dạng chuỗi; xóa dòng nếu không sử dụng.</p>
      {fields.map((row, index) => (
        <div key={row.id} className="grid items-start gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_1fr_auto]">
          <ProductField name={`${name}.${index}.key`} label={`Tên ${index + 1}`} required />
          <ProductField name={`${name}.${index}.value`} label={`Giá trị ${index + 1}`} required />
          <Button type="button" variant="outline" className="sm:mt-7" onClick={() => remove(index)} aria-label={`Xóa ${title.toLowerCase()} dòng ${index + 1}`}>Xóa dòng</Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ key: "", value: "" })}>Thêm {title.toLowerCase()}</Button>
    </fieldset>
  );
}
