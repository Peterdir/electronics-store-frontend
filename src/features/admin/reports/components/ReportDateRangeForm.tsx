import { useId, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { presetDateRange, vietnamToday, type DatePreset } from "../../dashboard/dateRange";
import { createReportRangeSchema } from "../schemas";
import type { ReportRange } from "../types";

interface ReportDateRangeFormProps {
  onPreview: (range: ReportRange) => void;
}

const presets: { value: DatePreset; label: string }[] = [
  { value: "7days", label: "7 ngày" },
  { value: "30days", label: "30 ngày" },
  { value: "month", label: "Tháng này" },
];

export function ReportDateRangeForm({ onPreview }: ReportDateRangeFormProps) {
  const [draft, setDraft] = useState(() => presetDateRange("30days"));
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = createReportRangeSchema().safeParse(draft);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError(null);
    onPreview(result.data);
  }

  return (
    <form noValidate onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm font-medium">Chọn nhanh khoảng ngày</legend>
        {presets.map((preset) => (
          <Button
            key={preset.value}
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(presetDateRange(preset.value));
              setError(null);
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
              max={vietnamToday()}
              value={draft[field]}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
              className="rounded-lg border border-input bg-background px-3 py-2"
            />
          </label>
        ))}
        <Button type="submit">Xem trước</Button>
      </div>
      <p className="text-sm text-muted-foreground">Chọn ngày rồi bấm Xem trước. Thay đổi ô nhập chưa làm đổi báo cáo đang xem.</p>
      {error && <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
