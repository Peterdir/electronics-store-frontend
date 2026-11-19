import { AdminPageHeader } from "../components/AdminPageHeader";

export function AdminHomePage() {
    return (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <AdminPageHeader
                title="Trang quản trị"
                description="Chào mừng bạn đến khu vực quản trị cửa hàng."
            />
        </section>
    )
}
