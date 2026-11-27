import { useId, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { presetDateRange, validateDateRange, type DatePreset } from "../dateRange";
import type { DateRange } from "../types";

interface DateRangeFilterProps {
  range: DateRange;
  onApply: (range: DateRange) => void;
}

const presets: { value: DatePreset; label: string }[] = [
  { value: "7days", label: "7 ngày" },
  { value: "30days", label: "30 ngày" },
  { value: "month", label: "Tháng này" },
];

export function DateRangeFilter({ range, onApply }: DateRangeFilterProps) {
  const [draft, setDraft] = useState(range);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = validateDateRange(draft);
    setError(message);
    if (!message) onApply(draft);
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm font-medium">Chọn nhanh khoảng ngày</legend>
        {presets.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant="outline"
            onClick={() => {
              const next = presetDateRange(preset.value);
              setDraft(next);
              setError(null);
              onApply(next);
            }}
          >
            {preset.label}
          </Button>
        ))}
      </fieldset>
      <div className="flex flex-wrap items-end gap-4">
        {(["startDate", "endDate"] as const).map((field) => (
          <label key={field} className="grid gap-2 text-sm">
            <span>{field === "startDate" ? "Từ ngày" : "Đến ngày"}</span>
            <input
              type="date"
              required
              value={draft[field]}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2"
            />
          </label>
        ))}
        <Button type="submit">Áp dụng khoảng tùy chọn</Button>
      </div>
      {error && <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
