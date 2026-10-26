import { useState } from "react";
import { formatVND } from "@/lib/format";
import type { ProductDetailsResponse, VariantResponse } from "../types";
import { VariantSelector } from "./VariantSelector";
import { StockIndicator } from "./StockIndicator";
import { QuantityStepper } from "./QuantityStepper";
import { useSession } from "@/shared/auth/session.store";
import { useGuestCart } from "@/features/cart/guestCart.store";
import { toast } from "sonner";

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
  const addGuestItem = useGuestCart((state) => state.add);
  const token = useSession((state) => state.token);

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

  function handleSelect(key: string, value: string) {

    const matchingCurrent = variants.filter((variant) =>
      visibleKeys.every((visibleKey) => {
        const expected = visibleKey === key ? value : String(selectedVariant?.attributes?.[visibleKey]);

        return String(variant.attributes?.[visibleKey]) === expected;
      }),
    );

    const matchingValue = variants.filter(
      (variant) => String(variant.attributes?.[key]) === value,
    );

    const candidates = matchingCurrent.length > 0 ? matchingCurrent : matchingValue;

    const next = candidates.find((variant) => variant.stock > 0) ?? candidates[0];

    if (!next) return;

    onVariantChange(next.id);
    setQuantity((current) =>
      next.stock > 0
        ? Math.max(1, Math.min(current, next.stock))
        : 0,
    );
  }

  function handleAddToCart() {
    if (token || !selectedVariant || displayedQuantity < 1) return;
    if (selectedVariant.status !== "ACTIVE") return;

    const result = addGuestItem({
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
      toast.success("Đã thêm vào giỏ hàng.");
    } else if (result.reason === "out-of-stock") {
      toast.error("Sản phẩm đã hết hàng.");
    } else if (result.reason === "exceeds-stock") {
      toast.warning(
        `Bạn chỉ có thể thêm ${result.remaining ?? 0} sản phẩm nữa.`,
      );
    } else {
      toast.error("Không thể thêm sản phẩm vào giỏ.");
    }
  }

  const displayedQuantity = selectedVariant && selectedVariant.stock > 0
      ? Math.max(1, Math.min(quantity, selectedVariant.stock))
      : 0;

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
      />

      <StockIndicator variant={selectedVariant} />

      <QuantityStepper
        value={displayedQuantity}
        max={selectedVariant?.stock ?? 0}
        onChange={setQuantity}
      />

      {!token && (
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedVariant || displayedQuantity < 1}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          Thêm vào giỏ
        </button>
      )}
    </div>
  );
}
