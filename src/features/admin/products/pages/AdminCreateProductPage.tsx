import { AdminPageHeader } from "../../components/AdminPageHeader";
import { ProductForm } from "../components/ProductForm";
import { isCurrentProductSession, useProductSession } from "../queries";

export function AdminCreateProductPage() {
  const session = useProductSession();
  if (!isCurrentProductSession(session)) return <p role="alert">Phiên quản trị không hợp lệ. Vui lòng đăng nhập lại.</p>;
  return (
    <section className="space-y-6">
      <AdminPageHeader title="Tạo sản phẩm" description="Nhập thông tin, thông số kỹ thuật, biến thể và ảnh sản phẩm." />
      <ProductForm key={`${session.userId}:${session.role}`} session={session} />
    </section>
  );
}
