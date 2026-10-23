import type { ID } from "@/shared/types/common";
import { toast } from "sonner";
import { useCompare } from "../compare.store";

interface Props {
  id: ID;
  name: string;
}

export function CompareToggleButton({ id, name }: Props) {
  const selected = useCompare((state) => state.compareIds.includes(id));
  const add = useCompare((state) => state.add);
  const remove = useCompare((state) => state.remove);

  function toggle() {
    if (selected) {
      remove(id);
    } else if (!add(id)) {
      toast.warning("Chỉ so sánh tối đa 4 sản phẩm.");
    }
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${selected ? "Bỏ" : "Thêm"} ${name} ${
        selected ? "khỏi" : "vào"
      } danh sách so sánh`}
      onClick={toggle}
      className="rounded-md border px-3 py-2 text-sm"
    >
      {selected ? "Bỏ so sánh" : "So sánh"}
    </button>
  );
}