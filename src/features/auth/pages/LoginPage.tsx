import { Button } from "@/components/ui/button"

export function LoginPage() {
    return (

        <div className="flex items-center justify-center">
            <section className="mx-auto w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
                <h1 className="text-2xl font-bold">
                    Đăng nhập
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                    Sử dụng email và mật khẩu của bạn
                </p>

                <form className="mt-6 space-y-4">
                    <div className="space-y-2">
                        <label
                            htmlFor="login-email"
                            className="block text-sm font-medium"
                        >
                            Email
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            autoComplete="username"
                            placeholder="user@gmail.com"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="login-password"
                            className="block text-sm font-medium"
                        >
                            Mật khẩu
                        </label>

                        <input
                            id="login-password"
                            type="password"
                            autoComplete="current-password"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <Button type="submit" disabled className="w-full">
                        Đăng nhập
                    </Button>

                    <p className="text-sm text-muted-foreground">
                        Form hiện chưa kết nối chức năng đăng nhập.
                    </p>
                </form>
            </section>
        </div>
    )
}