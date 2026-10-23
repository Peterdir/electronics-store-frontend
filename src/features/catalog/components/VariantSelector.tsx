import type { VariantResponse } from "../types";

interface VariantSelectorProps {
  variants: VariantResponse[];
  selectedVariant: VariantResponse | undefined;
  visibleKeys: string[];
  onSelect: (key: string, value: string) => void;
}

export function VariantSelector({
  variants,
  selectedVariant,
  visibleKeys,
  onSelect,
}: VariantSelectorProps) {
  return (
    <div className="space-y-4">

      {visibleKeys.map((key) => {

        const values = [
          ...new Set(
            variants
              .map((variant) => variant.attributes?.[key])
              .filter((value) => value !== undefined)
              .map(String),
          ),
        ];

        const label = ["color", "colour", "màu", "màu sắc"].includes(
          key.toLocaleLowerCase("vi"),
        )
          ? "Màu sắc"
          : "Dung lượng";

        return (
          <fieldset key={key} className="space-y-2">
            <legend className="font-medium">{label}</legend>

            <div className="flex flex-wrap gap-2">

              {values.map((value) => (

                <button
                  key={value}
                  type="button"
                  aria-pressed={
                    String(selectedVariant?.attributes?.[key]) === value
                  }
                  onClick={() => onSelect(key, value)}
                  className="rounded-md border px-3 py-2 text-sm aria-pressed:border-primary aria-pressed:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {value}
                </button>

              ))}

            </div>

          </fieldset>
        );

      })}

    </div>
  );
}