import { isRouteErrorResponse, Link, useRouteError } from "react-router"

export function RouteErrorBoundary() {
    const error = useRouteError();

    let title = "Đã xảy ra lỗi"
    let message = "Không thể tải nội dung này."

    if (isRouteErrorResponse(error)) {
        if (error.status === 403) {
            title = "Không có quyền truy cập"
            message = "Tài khoản hiện tại không được phép xem nội dung này"
        }
        else if (error.status === 404) {
            title = "Không tìm thấy nội dung"
            message = "Nội dung bạn cần có thể đã bị xóa hoặc không tồn tại"
        }
    }

    return (
        <main className="mx-auto flex flex-col items-center justify-center text-center px-4 py-12 gap-4 min-h-[60vh] max-w-xl">
            <h1 className="text-2xl font-semibold">{title}</h1>

            <p className="text-muted-foreground">{message}</p>

            <Link to="/" className="text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Về trang chủ</Link>
        </main>
    )
}