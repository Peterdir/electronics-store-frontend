import { Dialog } from "@base-ui/react/dialog";
import type { RefObject } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { BuyAgainResponse } from "../types";

function ResultList({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null;

  return (
    <section className="space-y-1">
      <h3 className="font-medium">{label}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm wrap-anywhere">
        {names.map((name, index) => <li key={index}>{name}</li>)}
      </ul>
    </section>
  );
}

export function BuyAgainResultDialog({
  result,
  onClose,
  trigger,
}: {
  result: BuyAgainResponse | undefined;
  onClose: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Dialog.Root open={Boolean(result)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Popup
          finalFocus={trigger}
          className="fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-card-foreground"
        >
          <Dialog.Title className="text-lg font-semibold">
            {result && result.addedItemsCount > 0
              ? "Đã thêm sản phẩm vào giỏ"
              : "Chưa thêm được sản phẩm nào"}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground">
            Số lượng thêm được phụ thuộc vào tồn kho hiện tại. Hãy xem giỏ hàng để kiểm tra số lượng và giá.
          </Dialog.Description>
          {result && (
            <>
              <ResultList label="Đã thêm vào giỏ" names={result.addedItemNames} />
              <ResultList label="Không thêm được" names={result.unavailableItemNames} />
            </>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Dialog.Close render={<Button type="button" variant="outline" />}>Đóng</Dialog.Close>
            <Link
              to="/cart"
              className="inline-flex min-h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Xem giỏ hàng
            </Link>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
