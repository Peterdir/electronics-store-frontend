import { useState } from "react";

interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function QuantityStepper({
  value,
  max,
  onChange,
}: QuantityStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const disabled = max < 1;

  function commit() {
    if (draft === null) return;

    if (disabled) {
      setDraft(null);
      return;
    }

    const parsed = Number(draft);
    const next = Number.isFinite(parsed)
      ? Math.max(1, Math.min(Math.trunc(parsed), max))
      : value;

    onChange(next);
    setDraft(null);
  }

  return (
    <div className="space-y-2">
      <label htmlFor="product-quantity" className="block font-medium">
        Số lượng
      </label>

      <div className="flex w-fit items-center rounded-md border">
        <button
          type="button"
          aria-label="Giảm số lượng"
          disabled={disabled || value <= 1}
          onClick={() => {
            setDraft(null);
            onChange(value - 1);
          }}
          className="px-3 py-2 disabled:opacity-40"
        >
          −
        </button>

        <input
          id="product-quantity"
          type="number"
          inputMode="numeric"
          min={disabled ? 0 : 1}
          max={max}
          step={1}
          disabled={disabled}
          value={disabled ? 0 : (draft ?? value)}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="w-14 appearance-[textfield] bg-transparent text-center outline-none disabled:opacity-60 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          aria-label="Tăng số lượng"
          disabled={disabled || value >= max}
          onClick={() => {
            setDraft(null);
            onChange(value + 1);
          }}
          className="px-3 py-2 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
