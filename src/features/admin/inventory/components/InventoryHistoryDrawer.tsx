import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { isCurrentInventorySession, useAdminInventory, useInventoryHistory, type InventorySession } from "../queries";
import type { InventoryResponse } from "../types";

export function InventoryHistoryDrawer({ item, session, onClose }: {
  item: InventoryResponse;
  session: InventorySession;
  onClose: () => void;
}) {
  const query = useInventoryHistory(item.id, session);
  const stockQuery = useAdminInventory({});
  const latestStock = stockQuery.data?.find((row) => row.id === item.id);
  return (
    <Dialog.Root
      open={isCurrentInventorySession(session)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto border-l bg-card p-6 text-card-foreground shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                Lịch sử tồn kho
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground wrap-anywhere">
                {item.productName || "Sản phẩm"} · {item.sku || "Chưa có SKU"} · Mã kho {item.id}.
                Người thao tác được hiển thị đúng dữ liệu server.
              </Dialog.Description>
            </div>
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
          </div>

          <div className="mt-5 space-y-4" aria-busy={query.isFetching}>
            <p role="status" className="text-sm">
              {stockQuery.isFetching
                ? "Đang tải tồn hiện tại…"
                : stockQuery.isError
                  ? "Không tải được tồn hiện tại. Đóng lịch sử và nhấn F5 để tải lại trang."
                  : latestStock
                    ? `Tồn hiện tại: ${latestStock.quantity?.toLocaleString("vi-VN") ?? "Không xác định"}`
                    : "Không tìm thấy bản ghi kho trong danh sách mới nhất."}
            </p>

            {query.isFetching && <p role="status">Đang tải lịch sử…</p>}
            {query.isError && (
              <p role="alert">
                {query.error.message}
                {query.data ? " Lịch sử dưới đây có thể chưa mới nhất." : ""}
                {" Nhấn F5 để tải lại trang."}
              </p>
            )}
            {query.data?.length === 0 && <p>Chưa có lịch sử điều chỉnh.</p>}

            {query.data && query.data.length > 0 && (
              <ol className="space-y-3">
                {query.data.map((entry) => (
                  <li key={entry.id} className="rounded-xl border p-4 text-sm">
                    <p className="font-semibold">
                      {entry.action === "ADD" ? "Thêm kho" : entry.action === "DEDUCT" ? "Trừ kho" : "Không xác định"}:
                      {" "}{entry.quantityChanged?.toLocaleString("vi-VN") ?? "—"} · Tồn sau thao tác:
                      {" "}{entry.finalStock?.toLocaleString("vi-VN") ?? "—"}
                    </p>
                    <p className="mt-2 wrap-anywhere">
                      Lý do: {entry.reason || "—"}
                    </p>
                    <p className="mt-2 text-muted-foreground wrap-anywhere">
                      Người thao tác: {entry.performedBy || "—"} · {entry.createdAt ? formatDateTime(entry.createdAt) : "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Mã lịch sử: {entry.id}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
