import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../app/theme";

function cn(...c: Array<string | false | null | undefined>) {
    return c.filter(Boolean).join(" ");
}

type Lang = "en" | "pl" | "ru" | "uk";

export function SettingsDialog({
    buttonClassName,
    iconOnly,
}: {
    buttonClassName?: string;
    iconOnly?: boolean;
}) {
    const { theme, setTheme } = useTheme();

    const [open, setOpen] = useState(false);
    const [tempTheme, setTempTheme] = useState(theme);
    const [tempLang, setTempLang] = useState<Lang>("en");

    // ESC ile kapat
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    // Açıkken body scroll kilitle (istersen kaldırabilirsin)
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    const modal = open ? (
        <div className="fixed inset-0 z-[9999]">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

            {/* ✅ gerçek tam orta */}
            <div className="relative h-full w-full flex items-center justify-center p-4">
                <div className="w-[92vw] max-w-sm">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/85 backdrop-blur-xl shadow-2xl">
                        {/* header */}
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="text-sm font-semibold tracking-tight text-slate-100">Settings</div>
                            <button
                                onClick={() => setOpen(false)}
                                className="h-8 w-8 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition grid place-items-center"
                                aria-label="Close"
                                type="button"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="h-px bg-white/10" />

                        <div className="px-5 py-4 space-y-5">
                            {/* THEME */}
                            <div>
                                <div className="text-xs font-medium text-slate-300">Theme</div>

                                <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
                                    <button
                                        onClick={() => setTempTheme("light")}
                                        className={cn(
                                            "h-9 rounded-lg text-sm transition",
                                            tempTheme === "light" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:bg-white/10"
                                        )}
                                        type="button"
                                    >
                                        ☀ Light
                                    </button>

                                    <button
                                        onClick={() => setTempTheme("dark")}
                                        className={cn(
                                            "h-9 rounded-lg text-sm transition",
                                            tempTheme === "dark" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:bg-white/10"
                                        )}
                                        type="button"
                                    >
                                        🌙 Dark
                                    </button>
                                </div>
                            </div>

                            {/* LANGUAGE */}
                            <div>
                                <div className="text-xs font-medium text-slate-300">Language</div>

                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <LangButton active={tempLang === "en"} onClick={() => setTempLang("en")} label="English" flag="🇬🇧" />
                                    <LangButton active={tempLang === "pl"} onClick={() => setTempLang("pl")} label="Polski" flag="🇵🇱" />
                                    <LangButton active={tempLang === "ru"} onClick={() => setTempLang("ru")} label="Русский" flag="🇷🇺" />
                                    <LangButton active={tempLang === "uk"} onClick={() => setTempLang("uk")} label="Українська" flag="🇺🇦" />
                                </div>

                                <div className="mt-2 text-[11px] text-slate-400">
                                    App UI stays English for now — language wiring can be added later.
                                </div>
                            </div>

                            {/* SAVE */}
                            <button
                                onClick={() => {
                                    setTheme(tempTheme);
                                    setOpen(false);
                                }}
                                className="w-full h-11 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition"
                                type="button"
                            >
                                Save Changes
                            </button>
                        </div>

                        <div className="pb-1" />
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <>
            <button
                onClick={() => {
                    setTempTheme(theme);
                    setOpen(true);
                }}
                className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm transition",
                    "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
                    buttonClassName,
                    iconOnly && "px-2"
                )}
                type="button"
                aria-label="Settings"
                title="Settings"
            >
                <span aria-hidden="true">⚙</span>
                {!iconOnly && <span>Settings</span>}
            </button>

            {/* ✅ portal: her zaman ekran ortası */}
            {open ? createPortal(modal, document.body) : null}
        </>
    );
}

function LangButton(props: { active: boolean; onClick: () => void; label: string; flag: string }) {
    return (
        <button
            onClick={props.onClick}
            className={cn(
                "h-10 rounded-xl border px-3 text-sm transition flex items-center gap-2 justify-center",
                props.active ? "border-blue-500/40 bg-blue-600/15 text-white" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            )}
            type="button"
        >
            <span className="text-base leading-none">{props.flag}</span>
            <span>{props.label}</span>
        </button>
    );
}