import { Heart, LoaderCircle, RefreshCw } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { isExpired } from "@/shared/auth/jwt";
import { useSession } from "@/shared/auth/session.store";
import type { ID } from "@/shared/types/common";
import { useSetWishlist, useWishlistState } from "../queries";

interface WishlistToggleButtonProps {
  productId: ID;
  productName: string;
}

export function WishlistToggleButton({ productId, productName }: WishlistToggleButtonProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { submit } = useSetWishlist();
  const { query, productIds, authenticated, busy } = useWishlistState();
  const selected = productIds.has(productId);
  const ready = query.isSuccess;
  const waitingForData = !ready && query.fetchStatus !== "idle";
  const disabled = authenticated && (busy || waitingForData);

  function handleClick() {
    const { user, token } = useSession.getState();
    if (!user || !token || isExpired(token)) {
      toast.info("Đăng nhập để lưu sản phẩm yêu thích.", {
        id: "wishlist-login",
        position: "bottom-right",
        duration: 3000,
        action: {
          label: "Đăng nhập",
          onClick: () => navigate("/login", { state: { from: location } }),
        },
      });
      return;
    }
    if (busy) return;
    if (!ready) {
      void query.refetch();
      return;
    }
    submit({ userId: user.id, token, productId, desired: !selected });
  }

  const label = authenticated && query.isError
    ? "Tải lại yêu thích"
    : authenticated && !ready
      ? query.fetchStatus === "paused" ? "Đang chờ mạng" : "Đang tải yêu thích"
      : selected ? "Bỏ yêu thích" : "Yêu thích";
  const Icon = authenticated && query.isError ? RefreshCw
    : authenticated && !ready ? LoaderCircle : Heart;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-pressed={authenticated && ready ? selected : undefined}
      aria-label={`${label}: ${productName}`}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon
        aria-hidden="true"
        className={authenticated && ready && selected
          ? "size-4 shrink-0 fill-current text-rose-500"
          : "size-4 shrink-0"}
      />
      <span>{label}</span>
    </button>
  );
}
