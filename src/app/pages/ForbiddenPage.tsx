import { Link } from 'react-router'

export function ForbiddenPage() {
    return (
        <main className="mx-auto flex flex-col min-h-[60vh] max-w-xl justify-center items-center gap-4 px-4 py-12 text-center">
            <p className="text-sm font-semibold tracking-wide text-primary">Lỗi 403</p>

            <h1 className="text-2xl font-semibold">Bạn không có quyền truy cập</h1>

            <p className="text-muted-foreground">Tài khoản hiện tại không được phép xem nội dung này</p>

            <Link to="/" className="text-primary underline underline-offset-4">Về trang chủ</Link>
        </main>
    )
}