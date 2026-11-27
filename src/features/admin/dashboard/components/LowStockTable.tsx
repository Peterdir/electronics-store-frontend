import { Link } from "react-router";
import { DataTable, type DataTableColumn } from "../../components/DataTable";
import type { LowStockProduct } from "../types";

const columns: DataTableColumn<LowStockProduct, never>[] = [
  { id: "name", header: "Sản phẩm", align: "left", cell: (item) => item.productName ?? "—" },
  { id: "sku", header: "SKU", cell: (item) => item.sku || "—" },
  { id: "quantity", header: "Tồn hiện tại", cell: (item) => item.quantity ?? "—" },
  {
    id: "inventory",
    header: "Thao tác",
    cell: (item) => item.sku ? (
      <Link
        to={`/admin/inventory?${new URLSearchParams({ keyword: item.sku, maxQuantity: "10" })}`}
        className="text-primary underline underline-offset-4"
      >
        Xem kho theo SKU
      </Link>
    ) : "Thiếu SKU",
  },
];

export function LowStockTable({ items }: { items: LowStockProduct[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Cảnh báo tồn kho hiện tại</h2>
      <DataTable
        caption="Các biến thể có tồn thấp nhất"
        columns={columns}
        rows={items}
        rowKey={(item) => item.productVariantId ?? item.sku ?? item.productName ?? "unknown"}
        emptyMessage="Không có cảnh báo tồn kho."
      />
    </section>
  );
}
