import { useState } from "react";
import { formatVND } from "@/lib/format";
import type { ProductDetailsResponse, VariantResponse } from "../types";
import { VariantSelector } from "./VariantSelector";
import { StockIndicator } from "./StockIndicator";
import { QuantityStepper } from "./QuantityStepper";
import { toast } from "sonner";
import { useCart } from "@/features/cart/useCart";
import { useNavigate } from "react-router";
import { useSession } from "@/shared/auth/session.store";
import { isExpired } from "@/shared/auth/jwt";

interface ProductPurchaseOptionsProps {
  product: ProductDetailsResponse;
  selectedVariantId: string | null;
  onVariantChange: (variantId: string) => void;
}

function findAttributeKey(
  variants: VariantResponse[],
  names: string[],
): string | undefined {
  const keys = [
    ...new Set(
      variants.flatMap((variant) => Object.keys(variant.attributes ?? {})),
    ),
  ];

  return keys.find((key) => names.includes(key.toLocaleLowerCase("vi")));
}

export function ProductPurchaseOptions({
  product,
  selectedVariantId,
  onVariantChange,
}: ProductPurchaseOptionsProps) {

  const cart = useCart();
  const navigate = useNavigate();
  const token = useSession((state) => state.token);
  const userId = useSession((state) => state.user?.id);
  
  const variants = (product.variants ?? []).filter(
    (variant) => variant.status === "ACTIVE",
  );

  const [quantity, setQuantity] = useState(1);

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];

  const colorKey = findAttributeKey(variants, [
    "color",
    "colour",
    "màu",
    "màu sắc",
  ]);

  const storageKey = findAttributeKey(variants, [
    "storage",
    "dung lượng",
    "bộ nhớ",
  ]);

  const isPhone = product.categoryName?.trim().toLocaleLowerCase("vi") === "điện thoại";

  const visibleKeys = [
    colorKey,
    isPhone ? storageKey : undefined,
  ].filter((key): key is string => key !== undefined);

  function getCandidates(key: string, value: string): VariantResponse[] {
    const matchingValue = variants.filter(
      (variant) => String(variant.attributes?.[key]) === value,
    );

    if (key === colorKey || !selectedVariant) {
      return matchingValue;
    }

    return matchingValue.filter((variant) =>
      visibleKeys.every(
        (otherKey) =>
          otherKey === key ||
          String(variant.attributes?.[otherKey]) ===
            String(selectedVariant.attributes?.[otherKey]),
      ),
    );
  }

  function getDisabledReason(
    key: string,
    value: string,
  ): string | undefined {
    if (key === colorKey) return undefined;

    const candidates = getCandidates(key, value);

    if (candidates.length === 0) {
      return "Không có phiên bản";
    }

    if (!candidates.some((variant) => variant.stock > 0)) {
      return "Hết hàng";
    }

    return undefined;
  }
  
  function handleSelect(key: string, value: string) {
    if (getDisabledReason(key, value) !== undefined) return;

    const candidates = getCandidates(key, value);

    const matchesCurrentSelection = (variant: VariantResponse) =>
      visibleKeys.every(
        (otherKey) =>
          otherKey === key ||
          String(variant.attributes?.[otherKey]) ===
            String(selectedVariant?.attributes?.[otherKey]),
      );

    const next =
      candidates.find(
        (variant) =>
          variant.stock > 0 && matchesCurrentSelection(variant),
      ) ??
      candidates.find((variant) => variant.stock > 0) ??
      candidates.find(matchesCurrentSelection) ??
      candidates[0];

    if (!next) return;

    const previousStorage = storageKey
      ? selectedVariant?.attributes?.[storageKey]
      : undefined;

    const nextStorage = storageKey
      ? next.attributes?.[storageKey]
      : undefined;

    onVariantChange(next.id);

    setQuantity((current) =>
      next.stock > 0
        ? Math.max(1, Math.min(current, next.stock))
        : 0,
    );

    if (
      key === colorKey &&
      storageKey &&
      visibleKeys.includes(storageKey) &&
      previousStorage !== undefined &&
      nextStorage !== undefined &&
      String(previousStorage) !== String(nextStorage)
    ) {
      toast.info(
        `Dung lượng đã chuyển sang ${String(nextStorage)} theo màu vừa chọn.`,
      );
    }
  }

  async function handleAddToCart() {
    if (!selectedVariant || displayedQuantity < 1 || cart.isAdding) return;
    if (selectedVariant.status !== "ACTIVE") return;
    
    try {
      const result = await cart.addItem({
        variantId: selectedVariant.id,
        quantity: displayedQuantity,
        snapshot: {
          productId: product.id,
          name: product.name,
          sku: selectedVariant.sku,
          price: selectedVariant.price,
          image: selectedVariant.imageUrl ?? product.images?.[0] ?? null,
          attributes: selectedVariant.attributes,
          stock: selectedVariant.stock,
        },
      });

      if (result.ok) {
        toast.success("Đã thêm vào giỏ hàng.", { duration: 1000 });
      } else if (result.reason === "out-of-stock") {
        toast.error("Sản phẩm đã hết hàng.");
      } else if (result.reason === "exceeds-stock") {
        toast.warning(
          `Bạn chỉ có thể thêm ${result.remaining ?? 0} sản phẩm nữa.`,
        );
      } else {
        toast.error("Không thể thêm sản phẩm vào giỏ.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
        ? error.message
        : "Không thể kết nối giỏ hàng.",
      );
    }
  }

  const displayedQuantity = selectedVariant && selectedVariant.stock > 0
  ? Math.max(1, Math.min(quantity, selectedVariant.stock))
  : 0;
  
  const canBuyNow =
    Boolean(selectedVariant) &&
    displayedQuantity > 0 &&
    !cart.isMerging &&
    (!token || (Boolean(userId) && !isExpired(token)));

  function handleBuyNow() {
    if (!canBuyNow || !selectedVariant) return;

    navigate("/checkout?source=buy-now", {
      state: {
        startedUserId: token ? userId : null,
        directItems: [
          {
            productVariantId: selectedVariant.id,
            quantity: displayedQuantity,
          },
        ],
        snapshot: {
          productId: product.id,
          productName: product.name,
          sku: selectedVariant.sku,
          unitPrice: selectedVariant.price,
          imageUrl:
            selectedVariant.imageUrl ?? product.images?.[0] ?? null,
          availableStock: selectedVariant.stock,
        },
      },
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-2xl font-semibold text-primary">
        {formatVND(selectedVariant?.price ?? product.basePrice)}
      </p>

      <VariantSelector
        variants={variants}
        selectedVariant={selectedVariant}
        visibleKeys={visibleKeys}
        onSelect={handleSelect}
        getDisabledReason={getDisabledReason}
      />

      <StockIndicator variant={selectedVariant} />

      <QuantityStepper
        value={displayedQuantity}
        max={selectedVariant?.stock ?? 0}
        onChange={setQuantity}
      />

      <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void handleAddToCart()}
          disabled={!selectedVariant || displayedQuantity < 1 || cart.isAdding}
          className="min-h-12 rounded-xl border border-primary/50 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary transition-colors enabled:hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cart.isMerging
            ? "Đang đồng bộ giỏ hàng…"
            : cart.isAdding
              ? "Đang thêm..."
              : "Thêm vào giỏ"}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!canBuyNow}
          className="min-h-12 rounded-xl border border-primary bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition-colors enabled:hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          Mua ngay
        </button>
      </div>
    </div>
  );
}
