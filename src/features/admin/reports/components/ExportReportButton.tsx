import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/shared/api/download";
import { exportRevenueReport } from "../api";
import { isCurrentReportsSession, type ReportsSession } from "../queries";
import type { ReportRange } from "../types";

interface ExportReportButtonProps {
  range: ReportRange;
  snapshot: ReportsSession;
  disabled: boolean;
}

export function ExportReportButton({ range, snapshot, disabled }: ExportReportButtonProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => () => pending.current?.abort(), []);

  async function exportCsv() {
    if (disabled || pending.current || !isCurrentReportsSession(snapshot)) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setMessage(null);

    try {
      const file = await exportRevenueReport(range, controller.signal, snapshot.token);
      if (controller.signal.aborted || !isCurrentReportsSession(snapshot)) return;
      downloadBlob(file.blob, file.filename);
      setMessage("Đã gửi file CSV tới trình duyệt.");
    } catch (error) {
      if (controller.signal.aborted || !isCurrentReportsSession(snapshot)) return;
      setMessage(error instanceof Error ? error.message : "Không thể tải CSV.");
    } finally {
      if (!controller.signal.aborted) {
        pending.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" disabled={disabled || busy} onClick={() => { void exportCsv(); }}>
        {busy ? "Đang tải CSV…" : "Tải CSV"}
      </Button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>
  );
}
