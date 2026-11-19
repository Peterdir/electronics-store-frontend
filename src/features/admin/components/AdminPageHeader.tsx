import type { ReactNode } from "react";

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
}

export function AdminPageHeader({
    title,
    description,
    actions,
}: AdminPageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

                {description && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </header>
    );
}
