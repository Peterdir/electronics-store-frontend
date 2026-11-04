import { Button } from "@/components/ui/button";
import type { AddressResponse } from "../types";

interface Props {
  address: AddressResponse;
  busy: boolean;
  confirmingDelete: boolean;
  onEdit: () => void;
  onSetDefault: () => void;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}

export function AddressCard({
  address,
  busy,
  confirmingDelete,
  onEdit,
  onSetDefault,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: Props) {
  return (
    <article className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-5 wrap-anywhere">
      <div className="flex justify-between gap-3">
        <div>
          <h2 className="font-semibold">{address.fullName}</h2>
          <p className="text-sm">{address.phone}</p>
        </div>

        {address.isDefault && (
          <span className="h-fit shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Mặc định</span>
        )}
      </div>

      <p className="text-sm">
        {[
          address.specificAddress,
          address.ward,
          address.district,
          address.province,
        ].filter(Boolean).join(", ")}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={onEdit}
        >
          Sửa
        </Button>

        {!address.isDefault && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onSetDefault}
          >
            Đặt mặc định
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={busy || Boolean(address.isDefault)}
          onClick={onRequestDelete}
        >
          Xóa
        </Button>
      </div>

      {address.isDefault && (
        <p className="text-xs text-muted-foreground">
          Hãy đặt địa chỉ khác làm mặc định trước khi xóa.
        </p>
      )}

      {confirmingDelete && (
        <div className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p>Xóa địa chỉ này?</p>

          <div className="flex gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={onConfirmDelete}
            >
              Xác nhận xóa
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onCancelDelete}
            >
              Giữ lại
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
