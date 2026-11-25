import { Dialog } from "@base-ui/react/dialog";
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { isPositiveLongId } from "@/shared/types/common";
import type { ReturnsSession } from "../queries";
import { returnStatusLabels, type AdminReturnRequest } from "../types";
import { ProcessReturnDialog } from "./ProcessReturnDialog";

interface Props {
  request: AdminReturnRequest;
  snapshot: ReturnsSession;
  blocked: boolean;
  onBlocked: () => void;
  onSaved: (request: AdminReturnRequest) => void;
  onClose: () => void;
}

export function ReturnRequestDrawer({ request, snapshot, blocked, onBlocked, onSaved, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog.Root
      open
      disablePointerDismissal
      onOpenChange={(next, event) => {
        if (busy) event.cancel();
        else if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl overflow-y-auto border-l border-border bg-card p-5 text-card-foreground shadow-xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold">Yêu cầu #{request.id}</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                Chi tiết từ danh sách yêu cầu trả hàng.
              </Dialog.Description>
            </div>
            <Dialog.Close render={<Button variant="outline" disabled={busy} />}>Đóng</Dialog.Close>
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Đơn hàng</dt>
              <dd className="mt-1 break-all font-medium">
                {isPositiveLongId(request.orderId) ? (
                  <Link className="text-primary underline" to={`/admin/orders/${request.orderId}`}>
                    #{request.orderId}
                  </Link>
                ) : "Không có mã đơn"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Dòng hàng</dt>
              <dd className="mt-1 break-all">#{request.orderItemId}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Số lượng trả</dt>
              <dd className="mt-1">{request.quantity}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Trạng thái yêu cầu</dt>
              <dd className="mt-1 font-medium">{returnStatusLabels[request.status]}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Ngày tạo</dt>
              <dd className="mt-1">{formatDateTime(request.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Cập nhật</dt>
              <dd className="mt-1">{formatDateTime(request.updatedAt)}</dd>
            </div>
          </dl>
          <div className="mt-6 space-y-5">
            <section>
              <h2 className="font-semibold">Lý do trả hàng</h2>
              <p className="mt-2 whitespace-pre-wrap wrap-anywhere text-sm">{request.reason}</p>
            </section>
            <section>
              <h2 className="font-semibold">Mô tả</h2>
              <p className="mt-2 whitespace-pre-wrap wrap-anywhere text-sm">
                {request.description || "Không có mô tả."}
              </p>
            </section>
            <section>
              <h2 className="font-semibold">Ghi chú xử lý</h2>
              <p className="mt-2 whitespace-pre-wrap wrap-anywhere text-sm">
                {request.adminNote || "Không có ghi chú."}
              </p>
            </section>
            <section>
              <h2 className="font-semibold">Ảnh bằng chứng</h2>
              {request.imageUrls?.length ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {request.imageUrls.map((url, index) => (
                    <a
                      key={`${url}-${index}`}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border p-2 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <img
                        src={url}
                        alt={`Bằng chứng ${index + 1} của yêu cầu ${request.id}`}
                        loading="lazy"
                        className="aspect-square w-full rounded object-contain"
                      />
                      <span className="mt-2 block text-center text-xs">Mở ảnh {index + 1}</span>
                    </a>
                  ))}
                </div>
              ) : <p className="mt-2 text-sm text-muted-foreground">Không có ảnh bằng chứng.</p>}
            </section>
            <ProcessReturnDialog
              request={request}
              snapshot={snapshot}
              blocked={blocked}
              onBlocked={onBlocked}
              onSaved={onSaved}
              onBusyChange={setBusy}
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
