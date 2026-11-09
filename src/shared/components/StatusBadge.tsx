interface StatusBadgeProps {
  label: string;
}

export function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
      {label}
    </span>
  );
}
