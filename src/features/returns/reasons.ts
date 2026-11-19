export const returnReasons = [
  { label: "Sản phẩm bị lỗi hoặc không hoạt động", requiresImages: true },
  { label: "Sản phẩm bị hư hỏng, móp méo hoặc vỡ", requiresImages: true },
  { label: "Giao sai sản phẩm hoặc phiên bản", requiresImages: false },
  { label: "Sản phẩm không đúng mô tả", requiresImages: false },
  { label: "Thiếu phụ kiện hoặc bộ phận đi kèm", requiresImages: false },
  { label: "Sản phẩm có dấu hiệu đã qua sử dụng", requiresImages: false },
];

export function requiresReturnImages(reason: string) {
  return returnReasons.some((option) => option.label === reason.trim() && option.requiresImages);
}
