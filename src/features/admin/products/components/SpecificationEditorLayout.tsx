import { useId, type ReactNode } from "react";
import { Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SpecificationEditorLayout({ title, rowIds, renderFields, onAdd, onRemove }: {
  title: string;
  rowIds: string[];
  renderFields: (index: number) => { name: ReactNode; value: ReactNode };
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const titleId = useId();
  return <section aria-labelledby={titleId} className="min-w-0 space-y-5">
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><SlidersHorizontal aria-hidden="true" className="size-5" /></span>
      <div className="min-w-0 space-y-1">
        <h2 id={titleId} className="flex flex-wrap items-center gap-2 text-base font-semibold">{title}<span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{rowIds.length}</span></h2>
        <p className="text-sm text-muted-foreground">Thêm từng cặp tên và giá trị. Mỗi tên chỉ xuất hiện một lần.</p>
      </div>
    </div>
    {rowIds.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
      <p className="text-sm font-medium">Chưa có {title.toLowerCase()}</p>
      <p className="mt-1 text-xs text-muted-foreground">Ví dụ: RAM — 16 GB, Màn hình — 6.7 inch.</p>
    </div> : <div className="space-y-3">
      {rowIds.map((id, index) => {
        const fields = renderFields(index);
        return <div key={id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_2.5rem] items-start gap-3 rounded-xl border border-border bg-muted/15 p-3 transition-colors focus-within:border-primary/40 focus-within:bg-primary/3 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1.25fr)_2.5rem] sm:p-4">
          <span aria-hidden="true" className="mt-7 hidden size-8 items-center justify-center rounded-lg bg-muted font-mono text-xs text-muted-foreground sm:flex">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0">{fields.name}</div>
          <div className="col-start-1 row-start-2 min-w-0 sm:col-start-auto sm:row-start-auto">{fields.value}</div>
          <Button type="button" variant="ghost" size="icon" className="col-start-2 row-span-2 row-start-1 mt-7 size-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:col-start-4 sm:row-span-1" aria-label={`Xóa ${title.toLowerCase()} dòng ${index + 1}`} title="Xóa dòng" onClick={() => onRemove(index)}><Trash2 aria-hidden="true" className="size-4" /></Button>
        </div>;
      })}
    </div>}
    <Button type="button" variant="outline" size="lg" className="h-11 w-full gap-2 border-dashed border-primary/30 bg-primary/5 font-medium text-primary hover:border-primary/50 hover:bg-primary/10 hover:text-primary" onClick={onAdd}><Plus aria-hidden="true" className="size-4" />Thêm {title.toLowerCase()}</Button>
  </section>;
}
