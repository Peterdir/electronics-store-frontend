import type { Key, ReactNode } from "react";

export interface DataTableColumn<T, TSort extends string> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortBy?: TSort;
}

interface DataTableProps<T, TSort extends string> {
  caption: string;
  columns: readonly DataTableColumn<T, TSort>[];
  rows: readonly T[];
  rowKey: (row: T) => Key;
  sortBy: TSort;
  direction: "asc" | "desc";
  onSort: (sortBy: TSort) => void;
  emptyMessage?: string;
}

export function DataTable<T, TSort extends string>({
  caption, columns, rows, rowKey, sortBy, direction, onSort,
  emptyMessage = "Không có dữ liệu.",
}: DataTableProps<T, TSort>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-230 text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/60">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className="px-4 py-3 font-semibold"
                aria-sort={column.sortBy === sortBy
                  ? direction === "asc" ? "ascending" : "descending"
                  : column.sortBy ? "none" : undefined}
              >
                {column.sortBy ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-ring"
                    onClick={() => { if (column.sortBy) onSort(column.sortBy); }}
                    aria-label={`Sắp xếp ${column.header}, ${column.sortBy === sortBy && direction === "asc" ? "giảm dần" : "tăng dần"}`}
                  >
                    {column.header}
                    <span aria-hidden="true">{column.sortBy === sortBy ? direction === "asc" ? "↑" : "↓" : "↕"}</span>
                  </button>
                ) : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">{emptyMessage}</td></tr>
          ) : rows.map((row) => (
            <tr key={rowKey(row)} className="align-top hover:bg-muted/30">
              {columns.map((column) => (
                <td key={column.id} className="px-4 py-4">{column.cell(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
