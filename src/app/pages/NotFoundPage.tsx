import {Link} from 'react-router'

export function NotFoundPage() {
    return (
        <main className="mx-auto flex flex-col min-h-[60vh] max-w-xl items-center justify-center gap-4 px-4 py-12 text-center">
            <p className="text-sm font-semibold tracking-wide text-primary">
                Lỗi 404
            </p>

            <h1 className="text-2xl font-semibold">
                Không tìm thấy trang
            </h1>

            <p className="text-muted-foreground">
                Đường dẫn này không tồn tại hoặc đã bị thay đổi
            </p>
            
            <Link to ="/" className="text-primary underline underline-offset-4">
                Về trang chủ
            </Link>
        </main>
    )
}