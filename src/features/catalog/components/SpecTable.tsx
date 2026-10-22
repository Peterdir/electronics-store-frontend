import type { Attributes } from "@/shared/types/common";

interface SpecTableProps {
  specification: Attributes | null;
}

export function SpecTable({ specification }: SpecTableProps) {
    const entries = Object.entries(specification ?? {});

    return (
        <section className="space-y-3" aria-labelledby="spec-heading">
            <h2 id="spec-heading" className="text-xl font-semibold">
                Thông số kỹ thuật
            </h2>

            {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Chưa có thông số kỹ thuật.
                </p>
            ) : (
                <dl className="overflow-hidden rounded-lg border">
                    {entries.map(([label, value]) => (
                        <div
                            key={label}
                            className="grid gap-1 border-b p-3 last:border-b-0 sm:grid-cols-3 sm:gap-4"
                        >
                            <dt className="font-medium">{label}</dt>
                            <dd className="sm:col-span-2">{String(value)}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </section>
    );
}