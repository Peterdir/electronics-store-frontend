interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <article className="space-y-2 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
      <p className="break-words text-2xl font-semibold tabular-nums">{value}</p>
    </article>
  );
}
