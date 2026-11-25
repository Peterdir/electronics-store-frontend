import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/shared/api/errors";
import { hasPermission } from "@/shared/auth/permissions";
import { useAdminProductLifecycle } from "../lifecycleQueries";
import { isCurrentProductSession, isProductWriteUncertain, type ProductSession } from "../queries";
import type { AdminProductDetailResponse, ProductLifecycleAction } from "../types";
import { DeactivateVariantAction } from "./DeactivateVariantAction";
import { ReactivateVariantAction } from "./ReactivateVariantAction";
import { ProductStatusAction } from "./ProductStatusAction";
import { SavedProductVariants } from "./SavedProductVariants";
import { ProductStatusBadge } from "./ProductStatusBadge";

export function ProductLifecycleManager({ product, session, unavailable, reload, children }: {
  product: AdminProductDetailResponse;
  session: ProductSession;
  unavailable: boolean;
  reload: () => Promise<AdminProductDetailResponse>;
  children: (controls: { statusControl: ReactNode; variants: ReactNode }) => ReactNode;
}) {
  const [selected, setSelected] = useState<Exclude<ProductLifecycleAction, { kind: "status" }> | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackVariantId, setFeedbackVariantId] = useState<string | null>(null);
  const mounted = useRef(false);
  const running = useRef(false);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const mutation = useAdminProductLifecycle(product.id);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (selected) confirmationRef.current?.focus();
  }, [selected]);
  const active = () => mounted.current && isCurrentProductSession(session);
  const canStatus = hasPermission("product.changeStatus", session.role);
  const canDeactivate = hasPermission("product.deactivateVariant", session.role);
  const canReactivate = hasPermission("product.reactivateVariant", session.role);
  const forbidden = mutation.error instanceof ApiError && mutation.error.status === 403;
  const busy = mutation.isPending || refreshing;
  const locked = busy || needsRefresh || forbidden || unavailable || !isCurrentProductSession(session);

  async function refresh() {
    if (running.current || !active()) return;
    running.current = true;
    setRefreshing(true);
    try {
      await reload();
      if (!active()) return;
      setNeedsRefresh(false);
      setSelected(null);
      setError("");
      if (!forbidden) mutation.reset();
    } catch (cause) {
      if (active()) {
        setNeedsRefresh(true);
        setError(`Không tải lại được dữ liệu: ${cause instanceof Error ? cause.message : "Lỗi kết nối"}. Nhấn F5 để tải lại trang.`);
      }
    } finally {
      running.current = false;
      if (active()) setRefreshing(false);
    }
  }

  async function perform(action: ProductLifecycleAction) {
    if (running.current || locked || !active()) return;
    if (action.kind === "status" ? !canStatus || action.status === product.status
      : action.kind === "reactivate" ? !canReactivate : !canDeactivate) return;
    running.current = true;
    setFeedbackVariantId(action.kind === "status" ? null : action.variantId);
    if (action.kind === "status") setSelected(null);
    setMessage("");
    setError("");
    let saved = false;
    try {
      await mutation.mutateAsync({ action, session: { ...session } });
      if (!active()) return;
      saved = true;
      setMessage(action.kind === "deactivate" ? "Đã ngừng bán biến thể." : action.kind === "reactivate" ? "Đã bật bán lại biến thể." : "");
      setSelected(null);
      setNeedsRefresh(true);
    } catch (cause) {
      if (!active()) return;
      const check = isProductWriteUncertain(cause) || (cause instanceof ApiError && (cause.status === 404 || cause.status === 400));
      setNeedsRefresh(check);
      const reason = cause instanceof ApiError && cause.status > 0
        ? `HTTP ${cause.status}: ${cause.message}`
        : cause instanceof Error ? cause.message : "Không lưu được trạng thái.";
      setError(check ? `${reason} Hãy đối chiếu kết quả trên máy chủ trước khi thao tác mới. Nhấn F5 để tải lại trang.` : reason);
    } finally {
      running.current = false;
    }
    if (saved && active()) await refresh();
  }

  const confirmation = selected && <div ref={confirmationRef} tabIndex={-1} role="group" aria-label="Xác nhận thay đổi trạng thái" className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">
    <p>{selected.kind === "reactivate" ? `Bán lại biến thể #${selected.variantId}? Giá và tồn kho hiện tại được giữ nguyên.` : `Ngừng bán biến thể #${selected.variantId}? Dữ liệu đơn hàng cũ được giữ nguyên.`}</p>
    {selected.kind === "reactivate" && product.status !== "ACTIVE" && <p className="text-muted-foreground">Sản phẩm đang {product.status === "HIDDEN" ? "ẩn" : "ngừng bán"}. Biến thể chỉ có thể được mua khi sản phẩm được bật bán.</p>}
    <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant={selected.kind === "reactivate" ? "default" : "destructive"} disabled={locked} onClick={() => void perform(selected)}>Xác nhận thay đổi</Button><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setSelected(null)}>Đóng xác nhận</Button></div>
  </div>;
  const feedback = <>
    {message && <p role="status" className="text-sm">{message}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {forbidden && <p role="alert" className="text-sm">Máy chủ từ chối quyền. Vui lòng đăng nhập lại để cập nhật phiên.</p>}
  </>;
  const statusControl = <div className="space-y-2" aria-busy={busy}>
    {canStatus ? <ProductStatusAction key={product.status} status={product.status} disabled={locked} onSelect={(status) => void perform({ kind: "status", status })} /> : <ProductStatusBadge status={product.status} />}
    {feedbackVariantId === null && feedback}
  </div>;
  const variants = <SavedProductVariants product={product} renderAction={canDeactivate || canReactivate ? (variant) => <div className="space-y-3" aria-busy={busy}>
    {variant.status === "INACTIVE" || variant.status === "HIDDEN"
      ? canReactivate && <ReactivateVariantAction variant={variant} disabled={locked} onSelect={() => { setFeedbackVariantId(variant.id); setSelected({ kind: "reactivate", variantId: variant.id }); }} />
      : canDeactivate && <DeactivateVariantAction variant={variant} disabled={locked} onSelect={() => { setFeedbackVariantId(variant.id); setSelected({ kind: "deactivate", variantId: variant.id }); }} />}
    {selected?.variantId === variant.id && confirmation}
    {feedbackVariantId === variant.id && feedback}
  </div> : undefined} />;
  return children({ statusControl, variants });
}
