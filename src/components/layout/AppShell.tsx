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

    // ✅ Home route'un senin projende "/app"
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
                    {/* ... HEADER aynı (senin kodun) ... */}
                    {/* Burayı değiştirmedim */}
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

            {/* ✅ FOOTER SADECE HOME'DA */}
            {isHome && <Footer />}

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
                            {/* ... Login form aynı ... */}
                        </form>
                    </div>
                </div>
            )}

            {/* MOBILE DRAWER */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    {/* ... Mobile drawer aynı ... */}
                </div>
            )}
        </div>
    );
}