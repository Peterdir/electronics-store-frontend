import { Link, useLocation } from "react-router";
import { formatVND } from "@/lib/format";
import { useCart } from "@/features/cart/useCart";
import { useCartMerge } from "@/features/cart/cartMerge.store";
import { useCheckoutCartValidation } from "@/features/cart/queries";
import { useSession } from "@/shared/auth/session.store";
import { isExpired } from "@/shared/auth/jwt";
import {
  readCheckoutEntry,
  type CheckoutEntry,
} from "../entry";

function CheckoutMessage({
  message,
  to,
  linkText,
}: {
  message: string;
  to: string;
  linkText: string;
}) {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Thanh toán</h1>
      <p role="alert">{message}</p>
      <Link to={to} className="text-primary underline">
        {linkText}
      </Link>
    </section>
  );
}

function UserCartValidation({
  userId,
  totalItems,
  totalPrice,
}: {
  userId: string;
  totalItems: number;
  totalPrice: number;
}) {
  const validation = useCheckoutCartValidation(userId);

  if (validation.isPending || validation.isFetching) {
    return <p role="status">Đang kiểm tra giỏ hàng…</p>;
  }

  if (validation.error) {
    return (
      <CheckoutMessage
        message={
          validation.error instanceof Error
            ? validation.error.message
            : "Không thể kiểm tra giỏ hàng."
        }
        to="/cart"
        linkText="Quay lại giỏ hàng"
      />
    );
  }

  if (!validation.data?.isValid) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">Thanh toán</h1>
        <p role="alert">
          {validation.data?.message ?? "Giỏ hàng chưa hợp lệ."}
        </p>
        <ul className="list-disc pl-5">
          {validation.data?.issues.map((issue) => (
            <li key={issue.cartItemId}>
              {issue.productName}: {issue.message}
            </li>
          ))}
        </ul>
        <Link to="/cart" className="text-primary underline">
          Quay lại giỏ hàng
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Thanh toán</h1>
      <p>Giỏ tài khoản đã được kiểm tra.</p>
      <p>{totalItems} sản phẩm · Tạm tính {formatVND(totalPrice)}</p>
      <Link to="/cart" className="text-primary underline">
        Quay lại giỏ hàng
      </Link>
    </section>
  );
}

function CartCheckoutEntry({ userId }: { userId: string | null }) {
  const cart = useCart();

  if (cart.isLoading) {
    return <p role="status">Đang tải giỏ hàng…</p>;
  }

  if (cart.error) {
    return (
      <CheckoutMessage
        message={cart.error.message}
        to="/cart"
        linkText="Quay lại giỏ hàng"
      />
    );
  }

  const hasIssues =
    cart.mode === "guest"
      ? cart.items.some(
          (item) =>
            item.snapshot.stock === 0 ||
            item.quantity > item.snapshot.stock,
        )
      : cart.items.some(
          (item) => item.isOutOfStock || !item.hasSufficientStock,
        );

  if (
    cart.isMerging ||
    cart.isChanging ||
    cart.totalItems === 0 ||
    (cart.mode === "guest" && hasIssues)
  ) {
    return (
      <CheckoutMessage
        message="Giỏ hàng chưa sẵn sàng để thanh toán."
        to="/cart"
        linkText="Quay lại giỏ hàng"
      />
    );
  }

  if (userId !== null) {
    return (
      <UserCartValidation
        userId={userId}
        totalItems={cart.totalItems}
        totalPrice={cart.totalPrice}
      />
    );
  }

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Thanh toán</h1>
      <p>Giỏ guest có {cart.totalItems} sản phẩm.</p>
      <p>Tạm tính {formatVND(cart.totalPrice)}</p>
      <p>Giá và tồn kho sẽ được xác nhận khi đặt hàng.</p>
      <Link to="/cart" className="text-primary underline">
        Quay lại giỏ hàng
      </Link>
    </section>
  );
}

function BuyNowCheckoutEntry({
  entry,
}: {
  entry: Extract<CheckoutEntry, { kind: "buyNow" }>;
}) {
  const isMerging = useCartMerge((state) => state.isMerging);

  if (
    isMerging ||
    entry.directItem.quantity > entry.snapshot.availableStock
  ) {
    return (
      <CheckoutMessage
        message="Sản phẩm chưa sẵn sàng để thanh toán."
        to={`/products/${entry.snapshot.productId}`}
        linkText="Quay lại sản phẩm"
      />
    );
  }

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Thanh toán</h1>
      <p>Mua ngay: {entry.snapshot.productName}</p>
      <p>SKU: {entry.snapshot.sku}</p>
      <p>Số lượng: {entry.directItem.quantity}</p>
      <p>
        Tạm tính:{" "}
        {formatVND(
          entry.snapshot.unitPrice * entry.directItem.quantity,
        )}
      </p>
      <Link
        to={`/products/${entry.snapshot.productId}`}
        className="text-primary underline"
      >
        Quay lại sản phẩm
      </Link>
    </section>
  );
}

function CheckoutSessionGate({ entry }: { entry: CheckoutEntry }) {
  const token = useSession((state) => state.token);
  const currentUserId = useSession((state) => state.user?.id);

  const sameSession =
    entry.startedUserId === null
      ? !token
      : Boolean(
          token &&
            !isExpired(token) &&
            currentUserId === entry.startedUserId,
        );

  if (!sameSession) {
    return (
      <CheckoutMessage
        message="Phiên mua hàng đã thay đổi. Hãy bắt đầu lại checkout."
        to={entry.startedUserId ? "/login" : "/products"}
        linkText={entry.startedUserId ? "Đăng nhập lại" : "Chọn sản phẩm"}
      />
    );
  }

  return entry.kind === "buyNow" ? (
    <BuyNowCheckoutEntry entry={entry} />
  ) : (
    <CartCheckoutEntry userId={entry.startedUserId} />
  );
}

export function CheckoutPage() {
  const location = useLocation();
  const entry = readCheckoutEntry(location.search, location.state);

  if (!entry) {
    return (
      <CheckoutMessage
        message="Không còn thông tin để tiếp tục checkout. Hãy bắt đầu lại từ giỏ hoặc sản phẩm."
        to="/cart"
        linkText="Quay lại giỏ hàng"
      />
    );
  }

  return <CheckoutSessionGate entry={entry} />;
}