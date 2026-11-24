import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { editProductSchema, toEditProductValues, type EditProductFormValues } from "../editProduct";
import {
  isCurrentProductSession, isProductWriteUncertain, useAdminProductBrands,
  useAdminProductCategories, useUpdateAdminProduct, type ProductSession,
} from "../queries";
import type { AdminProductDetailResponse } from "../types";
import { EditSpecificationEditor } from "./EditSpecificationEditor";
import { ProductField } from "./ProductField";

interface EditProductFormProps {
  product: AdminProductDetailResponse;
  session: ProductSession;
  unavailable: boolean;
  reload: () => Promise<AdminProductDetailResponse>;
}

export function EditProductForm({ product, session, unavailable, reload }: EditProductFormProps) {
  const mounted = useRef(false);
  const submitting = useRef(false);
  const awaitingRefresh = useRef(false);
  const [saved, setSaved] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const categories = useAdminProductCategories();
  const brands = useAdminProductBrands();
  const mutation = useUpdateAdminProduct(product.id);
  const form = useForm<EditProductFormValues>({ resolver: zodResolver(editProductSchema), defaultValues: toEditProductValues(product) });
  const { handleSubmit, reset, clearErrors, setError, control, formState: { errors, isDirty, isSubmitting } } = form;
  const categoryId = useWatch({ control, name: "categoryId" });
  const brandId = useWatch({ control, name: "brandId" });
  useEffect(() => {
    if (!isDirty && !submitting.current && !awaitingRefresh.current) reset(toEditProductValues(product));
  }, [product, isDirty, reset]);

  const busy = mutation.isPending || isSubmitting || reloading;
  const uncertain = isProductWriteUncertain(mutation.error);
  const forbidden = mutation.error instanceof ApiError && mutation.error.status === 403;
  const missing = mutation.error instanceof ApiError && mutation.error.status === 404;
  const locked = busy || saved || uncertain || forbidden || unavailable || !isCurrentProductSession(session);

  async function refreshSavedProduct() {
    setReloading(true);
    setRefreshError(null);
    try {
      const fresh = await reload();
      if (!mounted.current || !isCurrentProductSession(session)) return;
      reset(toEditProductValues(fresh));
      awaitingRefresh.current = false;
      setSaved(false);
      mutation.reset();
    } catch (error) {
      if (mounted.current && isCurrentProductSession(session)) {
        setRefreshError(error instanceof Error ? error.message : "Không tải lại được sản phẩm.");
      }
    } finally {
      if (mounted.current && isCurrentProductSession(session)) setReloading(false);
    }
  }

  async function submit(values: EditProductFormValues) {
    if (submitting.current || locked || !isCurrentProductSession(session)) return;
    submitting.current = true;
    clearErrors();
    try {
      await mutation.mutateAsync({ values, session: { ...session } });
      if (!mounted.current || !isCurrentProductSession(session)) return;
      awaitingRefresh.current = true;
      setSaved(true);
      await refreshSavedProduct();
    } catch (error) {
      if (!mounted.current || !isCurrentProductSession(session)) return;
      if (error instanceof ApiError) {
        for (const field of ["name", "categoryId", "brandId", "basePrice", "description"] as const) {
          const message = error.fieldErrors?.[field];
          if (message) setError(field, { type: "server", message });
        }
      }
      setError("root.server", { message: error instanceof Error ? error.message : "Không thể lưu sản phẩm." });
    } finally {
      submitting.current = false;
    }
  }

  const categoryOptions = [
    { value: "", label: "Chọn danh mục" },
    ...(categoryId && !categories.data?.some((item) => item.id === categoryId)
      ? [{ value: categoryId, label: `${product.categoryId === categoryId ? product.categoryName ?? "Danh mục" : "Danh mục"} #${categoryId} (chưa có trong lựa chọn)` }] : []),
    ...(categories.data ?? []).map((item) => ({ value: item.id, label: `${item.name}${item.status === "INACTIVE" ? " (ngừng hoạt động)" : ""}` })),
  ];
  const brandOptions = [
    { value: "", label: "Không có thương hiệu" },
    ...(brandId && !brands.data?.some((item) => item.id === brandId)
      ? [{ value: brandId, label: `${product.brandId === brandId ? product.brandName ?? "Thương hiệu" : "Thương hiệu"} #${brandId} (chưa có trong lựa chọn)` }] : []),
    ...(brands.data ?? []).map((item) => ({ value: item.id, label: `${item.name}${item.status === "INACTIVE" ? " (ngừng hoạt động)" : ""}` })),
  ];

  return (
    <FormProvider {...form}>
      <form noValidate aria-busy={busy} className="space-y-6" onSubmit={(event) => { void handleSubmit(submit)(event); }}>
        <fieldset disabled={locked} className="min-w-0 space-y-6">
          <fieldset className="min-w-0 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
            <legend className="px-2 text-lg font-semibold">Thông tin chung</legend>
            <ProductField<EditProductFormValues> name="name" label="Tên sản phẩm" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <ProductField<EditProductFormValues> name="categoryId" label="Danh mục" kind="select" options={categoryOptions} required />
              <ProductField<EditProductFormValues> name="brandId" label="Thương hiệu" kind="select" options={brandOptions} />
            </div>
            {(categories.isPending || brands.isPending) && <p role="status">Đang tải lựa chọn danh mục/thương hiệu…</p>}
            {categories.isError && <div role="alert" className="space-y-2 text-sm"><p>Không tải được danh mục: {categories.error.message} Lựa chọn đang nhập được giữ lại.</p><Button type="button" variant="outline" disabled={categories.isFetching} onClick={() => void categories.refetch()}>Tải lại danh mục</Button></div>}
            {brands.isError && <div role="alert" className="space-y-2 text-sm"><p>Không tải được thương hiệu: {brands.error.message} Lựa chọn đang nhập được giữ lại.</p><Button type="button" variant="outline" disabled={brands.isFetching} onClick={() => void brands.refetch()}>Tải lại thương hiệu</Button></div>}
            <ProductField<EditProductFormValues> name="basePrice" label="Giá cơ bản (VND)" inputMode="decimal" required />
            <ProductField<EditProductFormValues> name="description" label="Mô tả" kind="textarea" />
          </fieldset>
          <EditSpecificationEditor />
        </fieldset>
        {isDirty && <p className="text-sm text-muted-foreground">Có thay đổi chưa lưu. Tải lại dữ liệu nền sẽ giữ bản nháp đang nhập.</p>}
        {errors.root?.server && <p role="alert" className="text-sm text-destructive">{errors.root.server.message}</p>}
        {forbidden && <p role="alert">Máy chủ từ chối quyền. Vui lòng đăng nhập lại để cập nhật phiên.</p>}
        {missing && <p role="alert">Không tìm thấy sản phẩm hoặc danh mục/thương hiệu. Tải lại dữ liệu nền để kiểm tra; nếu sản phẩm vẫn còn, sửa lựa chọn danh mục/thương hiệu trước khi lưu lại.</p>}
        {saved && <p role="status">Đã lưu thông tin sản phẩm. Cần tải lại dữ liệu để xác nhận giá trị hiện tại; không cần gửi PUT lần nữa.</p>}
        {uncertain && <p role="alert">Chưa xác nhận được kết quả lưu. Hãy tải lại để kiểm tra trước khi tiếp tục. Hệ thống không tự gửi lại PUT; tải lại sẽ thay bản nháp bằng dữ liệu máy chủ.</p>}
        {refreshError && <p role="alert" className="text-sm text-destructive">Không tải lại được dữ liệu: {refreshError}</p>}
        {(saved || uncertain) && <Button type="button" variant="outline" disabled={busy} onClick={() => void refreshSavedProduct()}>Tải lại để kiểm tra kết quả</Button>}
        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4">
          <Button type="submit" disabled={locked || !isDirty}>{busy ? "Đang xử lý…" : "Lưu thông tin sản phẩm"}</Button>
          {!busy && <Link to="/admin/products" className="text-sm underline underline-offset-4">Về danh sách sản phẩm</Link>}
        </div>
      </form>
    </FormProvider>
  );
}
