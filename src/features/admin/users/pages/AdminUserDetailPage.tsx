import { useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "@/shared/api/errors";
import { RequireRole } from "@/shared/auth/guards";
import { PERMISSIONS } from "@/shared/auth/permissions";
import { isPositiveLongId } from "@/shared/types/common";
import { AdminPageHeader } from "../../components/AdminPageHeader";
import { UserRoleDialog } from "../components/UserRoleDialog";
import { UserStatusAction } from "../components/UserStatusAction";
import { UserStatusBadge } from "../components/UserStatusBadge";
import { useAdminUser, useUsersSession, type UsersSession } from "../queries";

export function AdminUserDetailPage() {
  const { id } = useParams();
  const snapshot = useUsersSession();

  return (
    <RequireRole roles={PERMISSIONS["user.view"]}>
      {!isPositiveLongId(id) ? <p role="alert">Mã người dùng không hợp lệ.</p> : snapshot && (
        <UserDetailContent key={`${snapshot.userId}:${snapshot.role}:${snapshot.token}:${id}`} id={id} snapshot={snapshot} />
      )}
    </RequireRole>
  );
}

function UserDetailContent({ id, snapshot }: { id: string; snapshot: UsersSession }) {
  const query = useAdminUser(id, snapshot);
  const [blocked, setBlocked] = useState(false);
  const [missing, setMissing] = useState(false);
  const [notice, setNotice] = useState("");
  const notFound = missing || (query.error instanceof ApiError && query.error.status === 404);
  const user = query.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Chi tiết người dùng" />
      <Link to="/admin/users" className="text-primary underline underline-offset-4">Danh sách người dùng</Link>
      {query.isPending && <p role="status">Đang tải người dùng…</p>}
      {notice && <p role="status" className="text-sm leading-6">{notice}</p>}
      {notFound ? <p role="alert">Người dùng không còn tồn tại.</p> : (
        <>
          {query.isError && <p role="alert" className="text-destructive">{query.error.message} Nhấn F5 để tải lại trang.</p>}
          {user && (
            <section className="space-y-6 rounded-xl border border-border bg-card p-6">
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                {[
                  ["ID", user.id], ["Họ tên", user.fullName ?? "—"], ["Email", user.email],
                  ["Điện thoại", user.phone || "—"], ["Vai trò", user.role],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-1 wrap-anywhere">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
                <div className="space-y-1">
                  <dt className="text-muted-foreground">Trạng thái</dt>
                  <dd><UserStatusBadge status={user.status} /></dd>
                </div>
              </dl>
              {user.id === snapshot.userId && <p className="text-sm text-muted-foreground">Đây là tài khoản đang đăng nhập. Không tự khóa hoặc tự đổi vai trò.</p>}
              {user.status === "PENDING" && <p className="text-sm text-muted-foreground">Tài khoản chờ xác thực. Màn hình này không phê duyệt hoặc mở khóa tài khoản PENDING.</p>}
              {snapshot.role === "MANAGER" && user.role !== "CUSTOMER" && <p className="text-sm text-muted-foreground">MANAGER chỉ được khóa/mở tài khoản CUSTOMER.</p>}
              <div className="flex flex-wrap gap-3">
                <UserStatusAction
                  user={user}
                  snapshot={snapshot}
                  blocked={blocked || query.isFetching || query.isError}
                  onBlocked={() => setBlocked(true)}
                  onMissing={() => setMissing(true)}
                  onNotice={setNotice}
                />
                <UserRoleDialog
                  user={user}
                  snapshot={snapshot}
                  blocked={blocked || query.isFetching || query.isError}
                  onBlocked={() => setBlocked(true)}
                  onMissing={() => setMissing(true)}
                  onNotice={setNotice}
                />
              </div>
              {blocked && <p role="alert" className="text-sm text-destructive">Đã khóa thao tác ghi trong lần mở trang này. Hãy đối chiếu kết quả máy chủ.</p>}
            </section>
          )}
        </>
      )}
    </div>
  );
}
