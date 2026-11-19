import { useRef, useState } from "react";
import { NavLink } from "react-router";
import { hasPermission } from "@/shared/auth/permissions";
import { useSession } from "@/shared/auth/session.store";
import { adminNavigation } from "../navigation";

export function AdminSidebar() {
    const role = useSession((state) => state.user?.role);
    const [isOpen, setIsOpen] = useState(false);
    const toggleRef = useRef<HTMLButtonElement>(null);

    const visibleItems = adminNavigation.filter((item) =>
        hasPermission(item.permission, role),
    );

    function closeAndFocusToggle() {
        setIsOpen(false);
        toggleRef.current?.focus();
    }

    function handleNavigation() {
        if (window.matchMedia("(min-width: 768px)").matches) {
            return;
        }

        setIsOpen(false);
        document.getElementById("admin-content")?.focus();
    }

    return (
        <aside
            className="min-w-0 border-b border-border bg-card p-4 md:border-b-0 md:border-r"
            onKeyDown={(event) => {
                if (
                    event.key === "Escape" &&
                    isOpen &&
                    !window.matchMedia("(min-width: 768px)").matches
                ) {
                    event.preventDefault();
                    closeAndFocusToggle();
                }
            }}
        >
            <button
                ref={toggleRef}
                type="button"
                aria-expanded={isOpen}
                aria-controls="admin-navigation"
                onClick={() => setIsOpen((current) => !current)}
                className="flex min-h-11 w-full items-center justify-between rounded-lg border border-border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
                <span>Điều hướng quản trị</span>
                <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>

            <div
                id="admin-navigation"
                className={`${isOpen ? "block" : "hidden"} mt-3 md:mt-0 md:block`}
            >
                <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Điều hướng
                </p>

                <nav aria-label="Điều hướng quản trị" className="space-y-1">
                    {visibleItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={(event) => {
                                if (
                                    event.button !== 0 ||
                                    event.ctrlKey ||
                                    event.metaKey ||
                                    event.shiftKey ||
                                    event.altKey
                                ) {
                                    return;
                                }

                                handleNavigation();
                            }}
                            className={({ isActive }) =>
                                [
                                    "flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                ].join(" ")
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
