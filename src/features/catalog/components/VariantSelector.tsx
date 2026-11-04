import type { VariantResponse } from "../types";

interface VariantSelectorProps {
  variants: VariantResponse[];
  selectedVariant: VariantResponse | undefined;
  visibleKeys: string[];
  onSelect: (key: string, value: string) => void;
  getDisabledReason: (key: string, value: string) => string | undefined;
}

export function VariantSelector({
  variants,
  selectedVariant,
  visibleKeys,
  onSelect,
  getDisabledReason,
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
              {values.map((value) => {
                const disabledReason = getDisabledReason(key, value);
                const selected =
                  String(selectedVariant?.attributes?.[key]) === value;

                return (
                  <button
                    key={value}
                    type="button"
                    disabled={disabledReason !== undefined}
                    aria-pressed={selected}
                    onClick={() => onSelect(key, value)}
                    className="min-h-11 rounded-xl border border-border px-3 py-2 text-sm transition-colors enabled:hover:border-primary/50 aria-pressed:border-primary aria-pressed:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="block">{value}</span>

                    {disabledReason && (
                      <span className="mt-1 block text-xs">
                        {disabledReason}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}