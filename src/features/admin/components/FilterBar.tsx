import type { ReactNode } from "react";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div role="group" aria-label="Bộ lọc danh sách" className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
      {children}
    </div>
  );
}
