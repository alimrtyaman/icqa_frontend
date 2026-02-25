import { NavLink } from "react-router-dom";
import { useMemo } from "react";

type NavItem = { to: string; label: string };

function Item({ to, label }: NavItem) {
    return (
        <NavLink
            to={to}
            style={({ isActive }) => ({
                display: "block",
                padding: "10px 12px",
                borderRadius: 12,
                textDecoration: "none",
                color: "#111827",
                background: isActive ? "#e5e7eb" : "transparent",
                fontWeight: isActive ? 800 : 600,
            })}
        >
            {label}
        </NavLink>
    );
}

export function Sidebar() {
    const items = useMemo<NavItem[]>(
        () => [
            { to: "/", label: "Home" },
            { to: "/audits/second-sorting", label: "Second Sorting Audit" },
            { to: "/audits/picking-exception", label: "Picking Exception Audit" },
            { to: "/audits/auto-pack", label: "Auto Pack Audit" },
        ],
        []
    );

    return (
        <aside
            style={{
                width: 280,
                background: "white",
                borderRight: "1px solid #e5e7eb",
                padding: 16,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 14px" }}>
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "#2563eb",
                        display: "grid",
                        placeItems: "center",
                        color: "white",
                        fontWeight: 900,
                    }}
                >
                    I
                </div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>ICQA</div>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                {items.map((it) => (
                    <Item key={it.to} to={it.to} label={it.label} />
                ))}
            </div>
        </aside>
    );
}