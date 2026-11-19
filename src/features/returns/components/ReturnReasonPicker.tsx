import { Dialog } from "@base-ui/react/dialog";
import { Check, ChevronDown, ListChecks, X } from "lucide-react";
import { useId, useState, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { returnReasons } from "../reasons";

const commonReasons = returnReasons.map((option) => option.label);

const otherReason = "other";

export function ReturnReasonPicker({ id, value, onChange, onBlur, ref, disabled, error }: {
  id: string;
  value: string;
  onChange: (reason: string) => void;
  onBlur: () => void;
  ref: Ref<HTMLButtonElement>;
  disabled: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [customReason, setCustomReason] = useState("");
  const radioName = useId();
  const confirmedReason = selected === otherReason ? customReason.trim() : selected;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">Lý do trả hàng</label>
      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen, event) => {
          if (disabled) {
            event.cancel();
            return;
          }
          if (nextOpen) {
            const isCommonReason = commonReasons.includes(value);
            setSelected(isCommonReason ? value : value ? otherReason : "");
            setCustomReason(isCommonReason ? "" : value);
          }
          setOpen(nextOpen);
        }}
      >
        <Dialog.Trigger
          render={
            <Button
              ref={ref}
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              onBlur={onBlur}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              className="h-auto min-h-12 w-full justify-between gap-3 rounded-xl bg-background px-3.5 py-3 text-left font-normal whitespace-normal"
            />
          }
        >
          <span className={cn("min-w-0 wrap-anywhere", !value && "text-muted-foreground")}>
            {value || "Chọn lý do trả hàng"}
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl outline-none">
            <div className="flex shrink-0 items-start gap-3 border-b border-border p-4 sm:px-6 sm:py-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <ListChecks aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-lg font-semibold tracking-tight">Lý do trả hàng</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Chọn lý do phù hợp với tình trạng sản phẩm.
                </Dialog.Description>
              </div>
              <Dialog.Close render={<Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label="Đóng lựa chọn lý do" />}>
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>

            <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:px-6">
              <fieldset disabled={disabled} className="min-w-0 space-y-2">
                <legend className="sr-only">Chọn một lý do trả hàng</legend>
                {[...commonReasons, otherReason].map((reason) => (
                  <label key={reason} className="relative flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3.5 py-3.5 transition-colors hover:bg-muted/60 has-checked:border-primary/50 has-checked:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring has-disabled:cursor-default has-disabled:opacity-50">
                    <input
                      type="radio"
                      name={radioName}
                      value={reason}
                      checked={selected === reason}
                      onChange={() => setSelected(reason)}
                      className="peer sr-only"
                    />
                    <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full border border-input bg-background peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground">
                      {selected === reason && <Check className="size-3.5" strokeWidth={2.5} />}
                    </span>
                    <span className="text-sm font-medium">{reason === otherReason ? "Lý do khác" : reason}</span>
                  </label>
                ))}
                {selected === otherReason && (
                  <div className="space-y-2 pt-2">
                    <label htmlFor={`${id}-custom`} className="block text-sm font-medium">Nhập lý do của bạn</label>
                    <textarea
                      id={`${id}-custom`}
                      rows={3}
                      value={customReason}
                      onChange={(event) => setCustomReason(event.target.value)}
                      className="form-control resize-y"
                      placeholder="Mô tả ngắn gọn lý do muốn trả hàng"
                    />
                  </div>
                )}
              </fieldset>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-muted/30 p-4 sm:px-6">
              <Dialog.Close render={<Button type="button" variant="outline" size="lg" disabled={disabled} />}>
                Hủy
              </Dialog.Close>
              <Button
                type="button"
                size="lg"
                disabled={disabled || !confirmedReason}
                onClick={() => {
                  onChange(confirmedReason);
                  onBlur();
                  setOpen(false);
                }}
              >
                Xác nhận
              </Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
