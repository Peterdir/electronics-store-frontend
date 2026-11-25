import { useEffect, useRef } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import {
  isCurrentProductSession, isProductCreateUncertain, useAdminProductBrands,
  useAdminProductCategories, useCreateAdminProduct, type ProductSession,
} from "../queries";
import { createProductSchema, newProductFormValues, type ProductFormValues } from "../schemas";
import { ProductField } from "./ProductField";
import { ProductImagesField } from "./ProductImagesField";
import { SpecificationEditor } from "./SpecificationEditor";
import { VariantFields } from "./VariantFields";

export function ProductForm({ session }: { session: ProductSession }) {
  const navigate = useNavigate();
  const submitting = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const categories = useAdminProductCategories();
  const brands = useAdminProductBrands();
  const mutation = useCreateAdminProduct();
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: newProductFormValues(),
  });
  const { handleSubmit, clearErrors, setError, control, formState: { errors, isSubmitting } } = form;
  const categoryId = useWatch({ control, name: "categoryId" });
  const brandId = useWatch({ control, name: "brandId" });
  const busy = mutation.isPending || isSubmitting;
  const uncertain = isProductCreateUncertain(mutation.error);
  const forbidden = mutation.error instanceof ApiError && mutation.error.status === 403;
  const locked = busy || uncertain || forbidden || !isCurrentProductSession(session);

  async function submit(values: ProductFormValues) {
    if (submitting.current || locked || !isCurrentProductSession(session)) return;
    submitting.current = true;
    clearErrors();
    try {
      await mutation.mutateAsync({ values, session: { ...session } });
      if (mounted.current && isCurrentProductSession(session)) navigate("/admin/products", { replace: true });
    } catch (error) {
      if (!mounted.current || !isCurrentProductSession(session)) return;
      if (error instanceof ApiError) {
        for (const field of ["name", "categoryId", "brandId", "basePrice", "description"] as const) {
          const message = error.fieldErrors?.[field];
          if (message) setError(field, { type: "server", message });
        }
      }
      setError("root.server", { message: error instanceof Error ? error.message : "Không thể tạo sản phẩm." });
    } finally {
      submitting.current = false;
    }
  }

  const categoryOptions = [
    { value: "", label: "Chọn danh mục" },
    ...(categoryId && !categories.data?.some((item) => item.id === categoryId)
      ? [{ value: categoryId, label: `Danh mục #${categoryId} (chưa có trong lựa chọn)` }] : []),
    ...(categories.data ?? []).map((item) => ({ value: item.id, label: `${item.name}${item.status === "INACTIVE" ? " (ngừng hoạt động)" : ""}` })),
  ];
  const brandOptions = [
    { value: "", label: "Không có thương hiệu" },
    ...(brandId && !brands.data?.some((item) => item.id === brandId)
      ? [{ value: brandId, label: `Thương hiệu #${brandId} (chưa có trong lựa chọn)` }] : []),
    ...(brands.data ?? []).map((item) => ({ value: item.id, label: `${item.name}${item.status === "INACTIVE" ? " (ngừng hoạt động)" : ""}` })),
  ];

  return (
    <FormProvider {...form}>
      <form noValidate aria-busy={busy} className="space-y-6" onSubmit={(event) => { void handleSubmit(submit)(event); }}>
        <fieldset disabled={locked} className="min-w-0 space-y-6">
          <fieldset className="min-w-0 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
            <legend className="px-2 text-lg font-semibold">Thông tin chung</legend>
            <p className="text-sm text-muted-foreground">* Bắt buộc. Backend tạo sản phẩm và biến thể ở trạng thái đang bán (ACTIVE).</p>
            <ProductField name="name" label="Tên sản phẩm" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <ProductField name="categoryId" label="Danh mục" kind="select" options={categoryOptions} required disabled={!categories.data} />
              <ProductField name="brandId" label="Thương hiệu" kind="select" options={brandOptions} disabled={!brands.data} />
            </div>
            {categories.isPending && <p role="status">Đang tải danh mục…</p>}
            {brands.isPending && <p role="status">Đang tải thương hiệu…</p>}
            {categories.isError && (
              <div role="alert" className="space-y-2 text-sm">
                <p>Không tải được danh mục: {categories.error.message}</p>
                <p>Nhấn F5 để tải lại trang; dữ liệu đang nhập sẽ bị xóa.</p>
              </div>
            )}
            {brands.isError && (
              <div role="alert" className="space-y-2 text-sm">
                <p>Không tải được thương hiệu: {brands.error.message} Bạn vẫn có thể tạo khi không chọn thương hiệu.</p>
                <p>Nhấn F5 để tải lại trang; dữ liệu đang nhập sẽ bị xóa.</p>
              </div>
            )}
            {categories.isSuccess && categories.data.length === 0 && <p role="status">Chưa có danh mục. Cần tạo danh mục trước khi tạo sản phẩm.</p>}
            <ProductField name="basePrice" label="Giá cơ bản (VND)" inputMode="decimal" required />
            <ProductField name="description" label="Mô tả" kind="textarea" />
          </fieldset>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6"><SpecificationEditor name="specification" title="Thông số kỹ thuật" /></div>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6"><VariantFields /></div>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6"><ProductImagesField disabled={locked} /></div>
        </fieldset>
        {errors.root?.server && <p role="alert" className="text-sm text-destructive">{errors.root.server.message}</p>}
        {uncertain && <p role="alert" className="text-sm text-destructive">Chưa xác nhận được kết quả tạo. Hãy kiểm tra danh sách trước khi tạo lại để tránh trùng sản phẩm. Hệ thống không tự gửi lại POST.</p>}
        {forbidden && <p role="alert" className="text-sm text-destructive">Máy chủ từ chối quyền. Vui lòng đăng nhập lại để cập nhật phiên.</p>}
        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4">
          <Button type="submit" disabled={locked || !categories.data?.length}>{busy ? "Đang tạo…" : "Tạo sản phẩm"}</Button>
          {!busy && <Link to="/admin/products" className="text-sm underline underline-offset-4">{uncertain ? "Kiểm tra danh sách sản phẩm" : "Quay lại danh sách"}</Link>}
        </div>
      </form>
    </FormProvider>
  );
}
