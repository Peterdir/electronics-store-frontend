import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { newProductVariant, type ProductFormValues } from "../schemas";
import { ProductField } from "./ProductField";
import { SpecificationEditor } from "./SpecificationEditor";

export function VariantFields() {
  const { control, formState: { errors } } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });
  return (
    <fieldset className="min-w-0 space-y-4">
      <legend className="mb-3 text-lg font-semibold">Biến thể *</legend>
      <p className="text-sm text-muted-foreground">Thêm từng biến thể với SKU riêng, giá bán và tồn kho ban đầu. Ví dụ thuộc tính: Màu = Đen, RAM = 8 GB.</p>
      {fields.map((row, index) => (
        <fieldset key={row.id} className="min-w-0 space-y-4 rounded-xl border border-border p-4">
          <legend className="px-2 font-medium">Biến thể {index + 1}</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <ProductField name={`variants.${index}.sku`} label="SKU" required />
            <ProductField name={`variants.${index}.price`} label="Giá bán (VND)" inputMode="decimal" required />
            <ProductField name={`variants.${index}.stock`} label="Tồn kho ban đầu" inputMode="numeric" required />
          </div>
          <SpecificationEditor key={`variants.${index}.attributes`} name={`variants.${index}.attributes`} title="Thuộc tính" />
          <Button type="button" variant="outline" disabled={fields.length <= 1} onClick={() => remove(index)}>Xóa biến thể {index + 1}</Button>
        </fieldset>
      ))}
      {errors.variants?.root?.message && <p role="alert" className="text-sm text-destructive">{errors.variants.root.message}</p>}
      <Button type="button" variant="outline" onClick={() => append(newProductVariant())}>Thêm biến thể</Button>
    </fieldset>
  );
}
