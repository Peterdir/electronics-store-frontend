import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { EditProductFormValues } from "../editProduct";
import { ProductField } from "./ProductField";

export function EditSpecificationEditor() {
  const { control } = useFormContext<EditProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "specification" });
  return (
    <fieldset className="min-w-0 space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
      <legend className="px-2 text-lg font-semibold">Thông số kỹ thuật</legend>
      <p className="text-sm text-muted-foreground">Dùng Văn bản cho giá trị thông thường. JSON giữ kiểu số, boolean, mảng hoặc object của dữ liệu đã có. Mỗi tên chỉ xuất hiện một lần.</p>
      {fields.map((row, index) => (
        <div key={row.id} className="grid items-start gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">
          <ProductField<EditProductFormValues> name={`specification.${index}.key`} label={`Tên thông số ${index + 1}`} required />
          <ProductField<EditProductFormValues> name={`specification.${index}.format`} label={`Kiểu giá trị ${index + 1}`} kind="select" options={[
            { value: "text", label: "Văn bản" }, { value: "json", label: "JSON" },
          ]} />
          <div className="sm:col-span-2"><ProductField<EditProductFormValues> name={`specification.${index}.value`} label={`Giá trị ${index + 1}`} kind="textarea" /></div>
          <Button type="button" variant="outline" onClick={() => remove(index)} aria-label={`Xóa thông số dòng ${index + 1}`}>Xóa dòng</Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ key: "", value: "", format: "text" })}>Thêm thông số</Button>
    </fieldset>
  );
}
