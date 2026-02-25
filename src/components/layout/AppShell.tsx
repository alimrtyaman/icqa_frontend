// src/components/layout/AppShell.tsx
import { useEffect, useMemo, useState } from "react";
import type { ReactElement, FormEvent, MouseEvent } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowLeftRight,
    BarChart3,
    ChevronDown,
    Clock,
    ClipboardCheck,
    ClipboardList,
    HelpCircle,
    Layers,
    Menu,
    Package,
    Percent,
    Truck,
    User,
    KeyRound,
    LogIn,
} from "lucide-react";

import { SettingsDialog } from "../settings/SettingsDialog";
import { Footer } from "./Footer";
import { useAuth } from "../auth/AuthProvider";

function cn(...classes: (string | false | null | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}

type NavItem = {
    to: string;
    label: string;
    icon: ReactElement;
};

type NavGroup = {
    title: string;
    items: NavItem[];
};

export function AppShell() {
    const location = useLocation();
    const nav = useNavigate();

    // ✅ Auth (tek kaynak)
    const { isAuthed, loginOpen, openLogin, closeLogin, login, logout } = useAuth();

    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [auditsOpen, setAuditsOpen] = useState(false);
    const [openSubGroup, setOpenSubGroup] = useState<string | null>(null);

    // ✅ Login form state (UI)
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const isHome = location.pathname === "/app" || location.pathname === "/app/";

    // ✅ HERO SLIDER (img3.png → img4.jpg → img5.jpg) every 5s
    const heroImages = useMemo(() => ["/img3.png", "/img4.jpg", "/img5.jpg"], []);
    const [heroIndex, setHeroIndex] = useState(0);

    useEffect(() => {
        if (!isHome) return; // sadece Home'da çalışsın
        const id = window.setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroImages.length);
        }, 5000);

        return () => window.clearInterval(id);
    }, [isHome, heroImages.length]);

    const groups: NavGroup[] = useMemo(
        () => [
            {
                title: "Operation Audits",
                items: [
                    { to: "/app/audits/second-sorting", label: "Second Sorting Audit", icon: <Layers size={16} /> },
                    { to: "/app/audits/picking-exception", label: "Picking Exception Audit", icon: <ClipboardList size={16} /> },
                    { to: "/app/audits/auto-pack", label: "Auto Pack Audit", icon: <Package size={16} /> },
                    { to: "/app/audits/defect-rate", label: "Defect Rate", icon: <Percent size={16} /> },
                ],
            },
            {
                title: "Shipping Audits",
                items: [
                    { to: "/app/shipping/warehouse-overdue", label: "Warehouse Overdue", icon: <Truck size={16} /> },
                    { to: "/app/shipping/critical-overdue", label: "Critical Overdue", icon: <Clock size={16} /> },
                ],
            },
            {
                title: "Shift Audit",
                items: [
                    { to: "/app/shift/inventory-check", label: "Inventory Check Report", icon: <ClipboardCheck size={16} /> },
                    { to: "/app/shift/abnormal-sorting", label: "Abnormal Sorting Report", icon: <AlertTriangle size={16} /> },
                ],
            },
            {
                title: "Work Efficiency",
                items: [
                    { to: "/app/efficiency/overview", label: "Operational Overview", icon: <BarChart3 size={16} /> },
                    { to: "/app/efficiency/libiao", label: "Libiao", icon: <BarChart3 size={16} /> },
                    { to: "/app/efficiency/sorting", label: "Sorting", icon: <ArrowLeftRight size={16} /> },
                ],
            },
        ],
        []
    );

    const pageTitle =
        location.pathname === "/app/audits/second-sorting"
            ? "Second Sorting Audit"
            : location.pathname === "/app/audits/picking-exception"
                ? "Picking Exception Audit"
                : location.pathname === "/app/audits/auto-pack"
                    ? "Auto Pack Audit"
                    : location.pathname === "/app/audits/defect-rate"
                        ? "Defect Rate"
                        : location.pathname === "/app/shipping/warehouse-overdue"
                            ? "Warehouse Overdue"
                            : location.pathname === "/app/shipping/critical-overdue"
                                ? "Critical Overdue"
                                : location.pathname === "/app/shift/inventory-check"
                                    ? "Inventory Anylysis"
                                    : location.pathname === "/app/shift/abnormal-sorting"
                                        ? "Abnormal Sorting Report"
                                        : location.pathname === "/app/efficiency/overview"
                                            ? "Operational Overview"
                                            : location.pathname === "/app/efficiency/libiao"
                                                ? "Libiao"
                                                : location.pathname === "/app/efficiency/sorting"
                                                    ? "Sorting"
                                                    : location.pathname === "/app/faq"
                                                        ? "FAQ"
                                                        : "ICQA";

    const pageDesc = "";

    useEffect(() => {
        document.title = isHome ? "ICQA" : `${pageTitle} • ICQA`;
    }, [isHome, pageTitle]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        // route değişince dropdown/drawer kapat
        setMobileOpen(false);
        setAuditsOpen(false);
        setOpenSubGroup(null);
    }, [location.pathname]);

    function handleAuthClick() {
        if (!isAuthed) {
            openLogin(location.pathname);
            return;
        }
        logout();
        nav("/app", { replace: true });
    }

    // ✅ Guard: token yoksa protected linke gitme, popup aç
    function guardNav(to: string) {
        return (e: MouseEvent) => {
            if (!isAuthed) {
                e.preventDefault();
                openLogin(to);
            }
        };
    }

    const tabBase = "rounded-xl px-3 py-2 text-sm font-semibold transition border whitespace-nowrap";
    const tabIdle =
        isHome && !scrolled
            ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
            : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white";

    const headerChrome = isHome
        ? scrolled
            ? "bg-black/60 backdrop-blur-xl border-white/10"
            : "bg-black/30 backdrop-blur-xl border-transparent"
        : "bg-black/70 backdrop-blur-xl border-white/10";

    const toggleAudits = () => {
        setAuditsOpen((prev) => {
            const next = !prev;
            if (next) setOpenSubGroup(null);
            return next;
        });
    };

    const toggleWorkEfficiency = () => {
        setOpenSubGroup((prev) => {
            const next = prev === "Work Efficiency" ? null : "Work Efficiency";
            if (next) setAuditsOpen(false);
            return next;
        });
    };

    const workEfficiencyGroup = groups.find((g) => g.title === "Work Efficiency");

    async function onSubmitLogin(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);

        try {
            const ok = await login(username.trim(), password);
            if (!ok) {
                setErr("Invalid credentials.");
                return;
            }

            setUsername("");
            setPassword("");

            const to = localStorage.getItem("post_login_redirect");
            if (to) {
                localStorage.removeItem("post_login_redirect");
                nav(to, { replace: true });
            }
        } finally {
            setLoading(false);
        }
    }

    function closeLoginModal() {
        closeLogin();
        setErr(null);
        setLoading(false);
        setPassword("");
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            {/* HEADER */}
            <header className={cn("sticky top-0 z-50 transition-all duration-300 border-b", headerChrome)}>
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-1">
                    <div className="h-20 grid grid-cols-3 items-center gap-4">
                        {/* LEFT */}
                        <div className="flex items-center gap-4">
                            <div className="hidden lg:block w-[220px]" />
                        </div>

                        {/* CENTER NAV */}
                        <div className="flex justify-center">
                            <nav className="hidden lg:flex items-center gap-4 flex-nowrap">
                                <NavLink
                                    to="/app"
                                    end
                                    className={({ isActive }) => cn(tabBase, tabIdle, isActive && "bg-white/10 text-white border-white/20")}
                                >
                                    Home
                                </NavLink>

                                {/* Audits & Analysis */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={toggleAudits}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-1 transition whitespace-nowrap",
                                            isHome && !scrolled ? "text-white/90 hover:text-white hover:bg-white/10" : "text-slate-200 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        Audits & Analysis
                                        <ChevronDown size={16} className={cn("transition-transform", auditsOpen && "rotate-180")} />
                                    </button>

                                    {auditsOpen && (
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[420px] rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur shadow-2xl z-50">
                                            <div className="p-4 space-y-4">
                                                {groups
                                                    .filter((g) => g.title !== "Work Efficiency")
                                                    .map((g) => {
                                                        const isSubOpen = openSubGroup === g.title;
                                                        return (
                                                            <div key={g.title}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setOpenSubGroup(isSubOpen ? null : g.title)}
                                                                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5 whitespace-nowrap"
                                                                >
                                                                    {g.title}
                                                                    <ChevronDown size={14} className={cn("transition-transform", isSubOpen && "rotate-180")} />
                                                                </button>

                                                                {isSubOpen && (
                                                                    <div className="mt-2 space-y-1 pl-2">
                                                                        {g.items.map((item) => (
                                                                            <NavLink
                                                                                key={item.to}
                                                                                to={item.to}
                                                                                onClick={guardNav(item.to)}
                                                                                className={({ isActive }) =>
                                                                                    cn(
                                                                                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-white/5",
                                                                                        isActive ? "bg-white/10 text-white" : "text-slate-300"
                                                                                    )
                                                                                }
                                                                            >
                                                                                <span className="text-slate-400">{item.icon}</span>
                                                                                {item.label}
                                                                            </NavLink>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Work Efficiency */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={toggleWorkEfficiency}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-1 transition whitespace-nowrap",
                                            isHome && !scrolled ? "text-white/90 hover:text-white hover:bg-white/10" : "text-slate-200 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        Work Efficiency
                                        <ChevronDown size={16} className={cn("transition-transform", openSubGroup === "Work Efficiency" && "rotate-180")} />
                                    </button>

                                    {openSubGroup === "Work Efficiency" && (
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[320px] rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur shadow-2xl z-50">
                                            <div className="p-3 space-y-1">
                                                {workEfficiencyGroup?.items.map((item) => (
                                                    <NavLink
                                                        key={item.to}
                                                        to={item.to}
                                                        onClick={guardNav(item.to)}
                                                        className={({ isActive }) =>
                                                            cn(
                                                                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-white/5",
                                                                isActive ? "bg-white/10 text-white" : "text-slate-300"
                                                            )
                                                        }
                                                    >
                                                        <span className="text-slate-400">{item.icon}</span>
                                                        {item.label}
                                                    </NavLink>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <NavLink
                                    to="/app/faq"
                                    onClick={guardNav("/app/faq")}
                                    className={({ isActive }) => cn(tabBase, tabIdle, isActive && "bg-white/10 text-white border-white/20")}
                                >
                                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                                        <HelpCircle size={16} className="text-slate-400" />
                                        FAQ
                                    </span>
                                </NavLink>
                            </nav>
                        </div>

                        {/* RIGHT ACTIONS */}
                        <div className="flex items-center justify-end gap-2">
                            <SettingsDialog
                                iconOnly
                                buttonClassName={cn(
                                    "rounded-xl border px-3 py-2 text-sm font-medium transition whitespace-nowrap",
                                    isHome && !scrolled ? "border-white/20 bg-white/10 text-white hover:bg-white/15" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                                )}
                            />

                            <button
                                onClick={handleAuthClick}
                                className={cn(
                                    "hidden sm:inline-flex rounded-xl border px-3 py-2 text-sm font-medium transition whitespace-nowrap",
                                    isHome && !scrolled ? "border-white/20 bg-white/10 text-white hover:bg-white/15" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                                )}
                                type="button"
                            >
                                {isAuthed ? "Logout" : "Login"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                className={cn(
                                    "lg:hidden rounded-xl border p-2 transition",
                                    isHome && !scrolled ? "border-white/20 bg-white/10 text-white hover:bg-white/15" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <Menu size={18} />
                            </button>
                        </div>
                    </div>

                    {!isHome && (
                        <div className="pb-4 pt-3">
                            <div className="text-xl sm:text-2xl font-bold tracking-tight">{pageTitle}</div>
                            <div className="mt-1 text-sm text-slate-400">{pageDesc}</div>
                        </div>
                    )}
                </div>
            </header>

            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* ✅ Home hero slider */}
                {isHome && (
                    <section className="w-full shrink-0 overflow-hidden leading-[0]">
                        <div
                            className="flex w-full transition-transform duration-700 ease-in-out"
                            style={{ transform: `translateX(-${heroIndex * 100}%)` }}
                        >
                            {heroImages.map((src) => (
                                <img key={src} src={src} alt="ICQA Hero" className="w-full h-auto block m-0 p-0 shrink-0" draggable={false} />
                            ))}
                        </div>
                    </section>
                )}

                <main className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 pt-6">
                    <Outlet />
                </main>
            </div>

            <Footer />

            {/* LOGIN MODAL */}
            {loginOpen && (
                <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 backdrop-blur-sm">
                    <div className="w-[420px] max-w-[92vw] rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Login</h3>
                            <button onClick={closeLoginModal} className="text-white/70 hover:text-white" type="button">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={onSubmitLogin} className="mt-4 space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm text-white outline-none focus:border-white/20"
                                        placeholder="Enter username"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400">Password</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        type="password"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-3 py-2 text-sm text-white outline-none focus:border-white/20"
                                        placeholder="Enter password"
                                    />
                                </div>
                            </div>

                            {err && <div className="text-sm text-red-300">{err}</div>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-blue-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
                            >
                                <LogIn className="h-4 w-4" />
                                {loading ? "Signing in..." : "Login"}
                            </button>

                            <div className="text-[11px] text-slate-500">
                                Backend JWT login → token saved to <span className="text-slate-300">localStorage(access_token)</span>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MOBILE DRAWER */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    <button className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
                    <div className="absolute right-0 top-0 h-full w-[320px] bg-slate-950 border-l border-white/10 p-4">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-white/90">Menu</div>
                            <button
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                                onClick={() => setMobileOpen(false)}
                                type="button"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-4 space-y-2">
                            <NavLink
                                to="/app"
                                end
                                className={({ isActive }) =>
                                    cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/5", isActive ? "bg-white/10 text-white" : "text-slate-300")
                                }
                            >
                                Home
                            </NavLink>

                            <div className="pt-2 text-xs font-semibold text-slate-500">Audits & Analysis</div>
                            {groups
                                .filter((g) => g.title !== "Work Efficiency")
                                .flatMap((g) => g.items)
                                .map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={guardNav(item.to)}
                                        className={({ isActive }) =>
                                            cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/5", isActive ? "bg-white/10 text-white" : "text-slate-300")
                                        }
                                    >
                                        <span className="text-slate-400">{item.icon}</span>
                                        {item.label}
                                    </NavLink>
                                ))}

                            <div className="pt-2 text-xs font-semibold text-slate-500">Work Efficiency</div>
                            {workEfficiencyGroup?.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={guardNav(item.to)}
                                    className={({ isActive }) =>
                                        cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/5", isActive ? "bg-white/10 text-white" : "text-slate-300")
                                    }
                                >
                                    <span className="text-slate-400">{item.icon}</span>
                                    {item.label}
                                </NavLink>
                            ))}

                            <div className="pt-2 text-xs font-semibold text-slate-500">Support</div>
                            <NavLink
                                to="/app/faq"
                                onClick={guardNav("/app/faq")}
                                className={({ isActive }) =>
                                    cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/5", isActive ? "bg-white/10 text-white" : "text-slate-300")
                                }
                            >
                                <HelpCircle size={16} className="text-slate-400" />
                                FAQ
                            </NavLink>

                            <div className="pt-3">
                                <button
                                    type="button"
                                    onClick={handleAuthClick}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 hover:text-white"
                                >
                                    {isAuthed ? "Logout" : "Login"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}