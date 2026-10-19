import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  isFetching,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Phân trang sản phẩm"
      className="flex items-center justify-center gap-4"
    >
      <Button
        type="button"
        variant="outline"
        disabled={currentPage <= 1 || isFetching}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Trang trước
      </Button>

      <span aria-current="page">
        Trang {currentPage} / {totalPages}
      </span>

      <Button
        type="button"
        variant="outline"
        disabled={currentPage >= totalPages || isFetching}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Trang sau
      </Button>
    </nav>
  );
}