import { Link } from "react-router";
import { toast } from "sonner";
import { useCart } from "../useCart";
import type { CartRow } from "../cartView.types";
import { CartItemRow } from "../components/CartItemRow";
import { CartSummary } from "../components/CartSummary";
import { ApiError } from "@/shared/api/errors";

export function CartPage() {
  const cart = useCart();

  async function changeQuantity(id: string, quantity: number) {
    if (cart.isChanging) return;

    try {
      await cart.updateQuantity(id, quantity);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể thay đổi số lượng."
      );
    }
  }

  async function removeItem(id: string) {
    if (cart.isChanging) return;

    try {
      await cart.removeItem(id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message: "Không thể xóa sản phẩm."
      );
    }
  }

  async function clearCart() {
    if (cart.isChanging) return;
    if (!window.confirm("Xóa toàn bộ giỏ hàng")) return;

    try {
      await cart.clearCart();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message: "Không thể xóa giỏ hàng."
      )
    }
  }

  if (cart.isLoading) {
    return (
      <section>
        <h1 className="text-2xl font-bold">Giỏ hàng</h1>
        <p role="status">Đang tải giỏ hàng…</p>
      </section>
    );
  }

  if (cart.error) {
    const sessionExpired =
      cart.error instanceof ApiError && cart.error.status === 401;

    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">Giỏ hàng</h1>
        <p role="alert">{cart.error.message}</p>

        {sessionExpired ? (
          <Link to="/login" className="text-primary underline">
            Đăng nhập lại
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => void cart.refetch?.()}
            className="text-primary underline"
          >
            Thử lại
          </button>
        )}
      </section>
    );
  }

  const rows: CartRow[] =
    cart.mode === "guest"
      ? cart.items.map((item) => ({
          id: item.variantId,
          productId: item.snapshot.productId,
          name: item.snapshot.name,
          sku: item.snapshot.sku,
          imageUrl: item.snapshot.image,
          attributes: item.snapshot.attributes,
          unitPrice: item.snapshot.price,
          quantity: item.quantity,
          subtotal: item.snapshot.price * item.quantity,
          stock: item.snapshot.stock,
          issue:
            item.snapshot.stock === 0 ||
            item.quantity > item.snapshot.stock,
        }))
      : cart.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.productName,
          sku: item.sku,
          imageUrl: item.imageUrl,
          attributes: item.attributes,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
          stock: item.availableStock,
          issue: item.isOutOfStock || !item.hasSufficientStock,
        }));

  const hasIssues = rows.some((row) => row.issue);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Giỏ hàng</h1>

      {rows.length === 0 ? (
        <div className="space-y-3">
          <p>Giỏ hàng của bạn đang trống</p>
          <Link to="/products" className="text-primary underline">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {rows.map((row) => (
              <CartItemRow 
                key={row.id}
                row={row}
                disabled={cart.isChanging}
                onQuantityChange={(quantity) =>
                  void changeQuantity(row.id, quantity)
                }
                onRemove={() => void removeItem(row.id)}
              />
            ))}
          </ul>

          <CartSummary
            totalItems={cart.totalItems}
            totalPrice={cart.totalPrice}
            hasIssues={hasIssues}
            disabled={cart.isChanging}
            onClear={() => void clearCart()}
          />

          {cart.mode === "guest" && (
            <p className="text-sm text-muted-foreground">
              Giá và tồn kho của giỏ guest được lưu tại thời điểm thêm hàng.
              Tổng tiền hiện chỉ là tạm tính.
            </p>
          )}
        </>
      )}
    </section>
  );
}
