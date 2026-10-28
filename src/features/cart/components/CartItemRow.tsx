import { useRef, useState } from "react";
import { Link } from "react-router";
import type { CartRow } from "../cartView.types";
import { formatVND } from "@/lib/format";
import { CartIssueBanner } from "./CartIssueBanner";
import { Trash2 } from "lucide-react";


export function CartItemRow({
  row,
  disabled,
  onQuantityChange,
  onRemove,
}: {
  row: CartRow;
  disabled: boolean;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {

    const [draft, setDraft] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const skipBlurCommit = useRef(false);

    function commitQuantity() {
        if (skipBlurCommit.current) {
            skipBlurCommit.current = false;
            setDraft(null);
            return;
        }

        if (draft === null) return;

        const parsed = Number(draft);
        setDraft(null);

        if (
            draft.trim() === "" ||
            !Number.isSafeInteger(parsed) ||
            row.stock < 1
        ) {
            return; // Dữ liệu không hợp lệ: trở lại số lượng cũ
        }

        const next = Math.max(1, Math.min(parsed, row.stock));
        if (next !== row.quantity) onQuantityChange(next);
    }

    function prepareButtonClick() {
        if (document.activeElement === inputRef.current) {
            skipBlurCommit.current = true;
        }
    }

    function changeWithButton(quantity: number) {
        skipBlurCommit.current = false;
        setDraft(null);
        onQuantityChange(quantity);
    }

    function removeWithButton() {
        skipBlurCommit.current = false;
        setDraft(null);
        onRemove();
    }
    return (
        <li className="space-y-4 rounded-md border p-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="flex min-w-0 items-center gap-4">
                    {row.imageUrl ? (
                        <img
                            src={row.imageUrl}
                            alt={row.name}
                            className="h-20 w-20 shrink-0 rounded-md object-cover"
                        />
                    ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-xs">
                            Chưa có ảnh
                        </div>
                    )}

                    <div className="min-w-0">
                        {row.productId ? (
                        <Link
                            to={`/products/${row.productId}`}
                            className="font-medium hover:underline"
                        >
                            {row.name}
                        </Link>
                        ) : (
                        <span className="font-medium">{row.name}</span>
                        )}

                        <p className="text-sm text-muted-foreground">SKU: {row.sku}</p>

                        {row.attributes && (
                            <p className="text-sm text-muted-foreground">
                                {Object.entries(row.attributes)
                                .map(([key, value]) => `${key}: ${String(value)}`)
                                .join(" · ")}
                            </p>
                        )}

                        <p>{formatVND(row.unitPrice)} / sản phẩm</p>
                    </div>
                </div>

                <div className="flex w-full items-center gap-3 border-t pt-3 lg:w-auto lg:justify-end lg:border-t-0 lg:pt-0">
                    <div className="inline-flex h-9 shrink-0 items-center overflow-hidden rounded-md border">
                        <button
                            type="button"
                            aria-label={`Giảm số lượng ${row.name}`}
                            disabled={disabled || row.quantity <= 1 || row.stock < 1}
                            onPointerDown={prepareButtonClick}
                            onClick={() => changeWithButton(Math.min(row.quantity - 1, row.stock))}
                            className="grid h-9 w-9 place-items-center hover:bg-muted disabled:opacity-40"
                        >
                            −
                        </button>

                        <input
                            ref={inputRef}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={row.stock}
                            step={1}
                            aria-label={`Số lượng ${row.name}`}
                            disabled={disabled || row.stock < 1}
                            value={draft ?? String(row.quantity)}
                            onChange={(event) => setDraft(event.target.value)}
                            onBlur={commitQuantity}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") event.currentTarget.blur();
                                if (event.key === "Escape") setDraft(null);
                            }}
                            className="h-9 w-12 border-x bg-transparent text-center text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />

                        <button
                            type="button"
                            aria-label={`Tăng số lượng ${row.name}`}
                            disabled={disabled || row.quantity >= row.stock}
                            onPointerDown={prepareButtonClick}
                            onClick={() => changeWithButton(row.quantity + 1)}
                            className="grid h-9 w-9 place-items-center hover:bg-muted disabled:opacity-40"
                        >
                            +
                        </button>
                    </div>

                    <p className="ml-auto whitespace-nowrap text-right text-base font-semibold tabular-nums lg:min-w-32">
                        {formatVND(row.subtotal)}
                    </p>

                    <button
                        type="button"
                        aria-label={`Xóa ${row.name} khỏi giỏ`}
                        title="Xóa khỏi giỏ"
                        disabled={disabled}
                        onPointerDown={prepareButtonClick}
                        onClick={removeWithButton}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <CartIssueBanner row={row} />
        </li>
    );
}
