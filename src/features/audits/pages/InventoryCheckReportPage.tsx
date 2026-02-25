import React, { useMemo, useState } from "react";
import {
    BadgeCheck,
    CheckCircle2,
    ClipboardList,
    FileSpreadsheet,
    Info,
    Search,
    ShieldAlert,
    Sparkles,
    TrendingUp,
    Upload,
    Users,
    AlertTriangle,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { apiPostMultipart } from "../../../lib/api"; // ✅ gerekirse ../../.. sayısını düzelt

type SessionStats = {
    totalRows: number;
    totalLocations: number;
    totalSku: number;
    discrepancies: number;
    accuracyPct: number;
    varianceUnits: number;
    avgBph: number;
    maxBph: number;
};

type OperatorRow = {
    operator: string;
    locations: number;
    sku: number;
    time: string;
    bph: number;
    discrepancies: number;
    accuracyPct: number;
};

type Result = {
    sessionStats: SessionStats;
    topPerformers: {
        topByBph: OperatorRow[];
        topByLocations: OperatorRow[];
    };
    operators: OperatorRow[];
};

function cn(...classes: (string | false | null | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}

function Pill({
    children,
    tone = "default",
}: {
    children: React.ReactNode;
    tone?: "default" | "good" | "warn" | "danger";
}) {
    const cls =
        tone === "good"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
            : tone === "warn"
                ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                : tone === "danger"
                    ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                    : "border-white/10 bg-white/5 text-slate-200";

    return (
        <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold", cls)}>
            {children}
        </span>
    );
}

/** (Artık kullanılmıyor ama istersen ileride geri eklemek için bırakıyorum) */
function RiskBanner({ s }: { s: SessionStats }) {
    const { discrepancies, accuracyPct } = s;

    const level =
        discrepancies === 0 ? "LOW" : accuracyPct >= 98 ? "MEDIUM" : accuracyPct >= 95 ? "HIGH" : "CRITICAL";

    const tone: "good" | "warn" | "danger" = level === "LOW" ? "good" : level === "MEDIUM" ? "warn" : "danger";

    const icon =
        tone === "good" ? (
            <BadgeCheck size={18} className="text-emerald-300" />
        ) : tone === "warn" ? (
            <ShieldAlert size={18} className="text-amber-300" />
        ) : (
            <AlertTriangle size={18} className="text-rose-300" />
        );

    const msg =
        level === "LOW"
            ? "No mismatches found."
            : level === "MEDIUM"
                ? "Minor mismatches detected."
                : level === "HIGH"
                    ? "Mismatch risk is noticeable."
                    : "Critical mismatch risk.";

    return (
        <div
            className={cn(
                "rounded-2xl border bg-white/[0.03] p-4",
                tone === "good"
                    ? "border-emerald-500/20"
                    : tone === "warn"
                        ? "border-amber-500/20"
                        : "border-rose-500/20"
            )}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5">{icon}</div>
                <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-100">Risk</div>
                        <Pill tone={tone}>{level}</Pill>
                    </div>
                    <div className="mt-1 text-sm text-slate-300">{msg}</div>
                </div>
            </div>
        </div>
    );
}

/** ✅ Overview Donut (3 renk: Locations / SKU / Avg BPH) */
const LOC_COLOR = "#2F6BFF";
const SKU_COLOR = "#27C6C0";
const BPH_COLOR = "#A78BFA";

type DonutItem = { name: string; value: number };

function DonutTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
        <div className="rounded-xl border border-white/10 bg-black/80 px-4 py-3 backdrop-blur-xl">
            <div className="text-xs font-bold text-zinc-400">{p.name}</div>
            <div className="text-lg font-black text-white mt-1">{Number(p.value).toLocaleString()}</div>
        </div>
    );
}

function OverviewDonut({ s }: { s: SessionStats }) {
    const donutData: DonutItem[] = [
        { name: "Locations", value: s.totalLocations },
        { name: "SKU", value: s.totalSku },
        { name: "Avg BPH", value: s.avgBph },
    ];

    return (
        // ✅ ortalı + biraz daha geniş
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-slate-200">Summary</div>
                    <div className="text-xs text-slate-400">Locations • SKU • Avg BPH</div>
                </div>
                <Pill>Donut</Pill>
            </div>

            {/* ✅ donut daha geniş + ortalı */}
            <div className="mt-5 grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8 items-center">
                <div className="relative mx-auto h-[320px] w-full max-w-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<DonutTooltip />} />
                            <Pie
                                data={donutData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius="60%"
                                outerRadius="98%"
                                paddingAngle={4}
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth={2}
                            >
                                <Cell fill={LOC_COLOR} />
                                <Cell fill={SKU_COLOR} />
                                <Cell fill={BPH_COLOR} />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                    {donutData.map((it, idx) => {
                        const color = idx === 0 ? LOC_COLOR : idx === 1 ? SKU_COLOR : BPH_COLOR;
                        return (
                            <div
                                key={it.name}
                                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-3"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                                    <div className="text-sm font-semibold text-slate-200 truncate">{it.name}</div>
                                </div>
                                <div className="text-lg font-extrabold text-white tabular-nums">{it.value.toLocaleString()}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function InventoryCheckReportPage() {
    const [phase, setPhase] = useState<"idle" | "scanning" | "ready">("idle");
    const [fileName, setFileName] = useState<string | null>(null);
    const [result, setResult] = useState<Result | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const [tab, setTab] = useState<"overview" | "operation details">("overview");
    const [query, setQuery] = useState("");
    const [onlyMismatch, setOnlyMismatch] = useState(false);

    const stats = result?.sessionStats;

    const operators = useMemo(() => {
        if (!result) return [];
        let rows = result.operators;

        if (onlyMismatch) rows = rows.filter((r) => r.discrepancies > 0);

        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) => r.operator.toLowerCase().includes(q));
    }, [result, query, onlyMismatch]);

    async function onPickFile(f?: File) {
        if (!f) return;

        setErr(null);
        setFileName(f.name);
        setPhase("scanning");

        try {
            const fd = new FormData();
            fd.append("file", f);

            const json = await apiPostMultipart<Result>("/api/audits/inventory-check/analyze", fd);
            setResult(json);
            setPhase("ready");
            setTab("overview");
        } catch (e: any) {
            setErr(e?.message ?? "Request failed");
            setPhase("idle");
            setFileName(null);
            setResult(null);
        }
    }

    function reset() {
        setPhase("idle");
        setFileName(null);
        setResult(null);
        setErr(null);
        setQuery("");
        setOnlyMismatch(false);
        setTab("overview");
    }

    return (
        <div className="space-y-6">
            {/* TOP BAR */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
                        <FileSpreadsheet size={18} className="text-emerald-300" />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-200 truncate">Inventory Check Report</div>
                        <div className="text-xs text-slate-400 truncate">
                            {fileName ? `Loaded: ${fileName}` : "Upload .xlsx to generate report"}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={reset}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                        type="button"
                    >
                        New
                    </button>

                    <button
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-50"
                        type="button"
                        onClick={() => alert("Export hook here")}
                        disabled={!result}
                    >
                        Export
                    </button>
                </div>
            </div>

            {err && <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{err}</div>}

            {/* BODY */}
            {phase === "idle" && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="flex items-start gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                            <Upload className="text-slate-200" />
                        </div>
                        <div className="flex-1">
                            <div className="text-lg font-bold">Upload Inventory Excel</div>
                            <div className="mt-1 text-sm text-slate-400">We’ll calculate accuracy, variance units and discrepancies summary.</div>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
                                    <Upload size={16} />
                                    Choose file
                                    <input type="file" accept=".xlsx" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0])} />
                                </label>
                                <div className="text-xs text-slate-500">Supported: .xlsx</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {phase === "scanning" && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 overflow-hidden relative">
                    <div className="flex items-center gap-2 text-slate-200 font-semibold">
                        <Sparkles size={18} className="text-emerald-300" />
                        Analyzing inventory…
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-1/2 bg-emerald-400/80 animate-[scan_1.2s_ease-in-out_infinite]" />
                    </div>
                    <div className="mt-3 text-xs text-slate-400">Comparing counts • Detecting variances • Building report</div>

                    <style>{`
            @keyframes scan {
              0% { transform: translateX(-60%); }
              100% { transform: translateX(220%); }
            }
          `}</style>
                </div>
            )}

            {phase === "ready" && result && stats && (
                <div className="space-y-6">
                    {/* ✅ HEADER STATS (Variance Units kartı kaldırıldı + 3 kart ortalı) */}
                    <div className="mx-auto w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-xs text-slate-400">Accuracy</div>
                            <div className="mt-1 text-2xl font-bold text-slate-100">{stats.accuracyPct.toFixed(2)}%</div>
                            <div className="mt-1 text-xs text-slate-500">Session accuracy</div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-xs text-slate-400">Discrepancies</div>
                            <div className="mt-1 text-2xl font-bold text-amber-300">{stats.discrepancies}</div>
                            <div className="mt-1 text-xs text-slate-500">Mismatch count</div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-xs text-slate-400">Locations</div>
                            <div className="mt-1 text-2xl font-bold text-emerald-300">{stats.totalLocations.toLocaleString()}</div>
                            <div className="mt-1 text-xs text-slate-500">Rows: {stats.totalRows.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* TABS */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTab("overview")}
                            className={cn(
                                "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                                tab === "overview" ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                            )}
                        >
                            <TrendingUp size={16} className="inline-block mr-2 text-slate-300" />
                            Overview
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("operation details")}
                            className={cn(
                                "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                                tab === "operation details" ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                            )}
                        >
                            <Users size={16} className="inline-block mr-2 text-slate-300" />
                            Operation details
                        </button>

                    </div>

                    {/* OVERVIEW (Risk kaldırıldı, donut ortalı/geniş) */}
                    {tab === "overview" && (
                        <div className="space-y-6">
                            <OverviewDonut s={stats} />

                            {/* Bu info kutusu kalsın mı? İstersen kaldırabilirim */}
                            <div className="mx-auto w-full max-w-5xl rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <Info size={18} className="text-slate-300" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-200">Discrepancies </div>
                                        <div className="mt-1 text-sm text-slate-300">
                                            Total quantity difference across checked locations. Use it to prioritize re-check areas.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OPERATORS */}
                    {tab === "operation details" && (
                        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
                            {/* Left */}
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-sm font-bold text-white/90">Session</div>

                                    {/* Session altına accuracy + discrepancies */}
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                            <div className="text-[11px] font-semibold text-slate-400">Accuracy</div>
                                            <div className="mt-1 text-lg font-extrabold text-slate-100 tabular-nums">{stats.accuracyPct.toFixed(2)}%</div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                            <div className="text-[11px] font-semibold text-slate-400">Discrepancies</div>
                                            <div className="mt-1 text-lg font-extrabold text-amber-300 tabular-nums">{stats.discrepancies}</div>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                            <div className="text-[11px] font-semibold text-slate-400">Locations</div>
                                            <div className="mt-1 text-lg font-extrabold text-slate-100 tabular-nums">{stats.totalLocations.toLocaleString()}</div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                                            <div className="text-[11px] font-semibold text-slate-400">Avg BPH</div>
                                            <div className="mt-1 text-lg font-extrabold text-slate-100 tabular-nums">{stats.avgBph}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-sm font-bold text-white/90">Top performers</div>

                                    <div className="mt-4">
                                        <div className="text-[11px] font-extrabold text-amber-300 tracking-wide">TOP 3 BY BPH</div>
                                        <div className="mt-2 space-y-2">
                                            {(result.topPerformers?.topByBph ?? []).slice(0, 3).map((r, idx) => (
                                                <div
                                                    key={`bph-${r.operator}-${idx}`}
                                                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-6 w-6 rounded-full border border-white/10 bg-white/5 grid place-items-center text-[11px] font-black text-slate-200">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-semibold text-slate-100">{r.operator}</div>
                                                            <div className="text-[11px] text-slate-400">Loc: {r.locations} • SKU: {r.sku}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-bold text-blue-300 tabular-nums">{r.bph}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="my-4 h-px bg-white/10" />

                                    <div>
                                        <div className="text-[11px] font-extrabold text-amber-300 tracking-wide">TOP 3 BY LOCATIONS</div>
                                        <div className="mt-2 space-y-2">
                                            {(result.topPerformers?.topByLocations ?? []).slice(0, 3).map((r, idx) => (
                                                <div
                                                    key={`loc-${r.operator}-${idx}`}
                                                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-6 w-6 rounded-full border border-white/10 bg-white/5 grid place-items-center text-[11px] font-black text-slate-200">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-semibold text-slate-100">{r.operator}</div>
                                                            <div className="text-[11px] text-slate-400">BPH: {r.bph} • SKU: {r.sku}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-bold text-emerald-300 tabular-nums">{r.locations}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-white/10">
                                    <div className="text-sm font-bold text-white/90">Results</div>

                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                placeholder="Search"
                                                className="w-[220px] rounded-full border border-white/10 bg-black/20 pl-9 pr-3 py-1.5 text-sm text-slate-100 outline-none focus:border-white/20"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setOnlyMismatch((v) => !v)}
                                            className={cn(
                                                "rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                                                onlyMismatch ? "border-amber-500/30 bg-amber-500/10 text-amber-200" : "border-white/10 bg-black/20 text-slate-200 hover:bg-white/10"
                                            )}
                                        >
                                            Only mismatches
                                        </button>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-black/20 text-slate-400">
                                            <tr className="[&>th]:px-4 [&>th]:py-3 text-left">
                                                <th>OPERATOR</th>
                                                <th className="text-right">LOC</th>
                                                <th className="text-right">SKU</th>
                                                <th className="text-right">TIME</th>
                                                <th className="text-right">BPH</th>
                                                <th className="text-right">DISC</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {operators.map((r) => (
                                                <tr key={`op-${r.operator}-${r.time}-${r.sku}`} className="hover:bg-white/5">
                                                    <td className="px-4 py-3 font-semibold text-slate-100">{r.operator}</td>
                                                    <td className="px-4 py-3 text-right text-slate-200 tabular-nums">{r.locations}</td>
                                                    <td className="px-4 py-3 text-right text-slate-200 tabular-nums">{r.sku}</td>
                                                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{r.time}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-100 tabular-nums">{r.bph}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums">
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold",
                                                                r.discrepancies > 0
                                                                    ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                                                                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                                            )}
                                                        >
                                                            {r.discrepancies}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}

                                            {operators.length === 0 && (
                                                <tr>
                                                    <td className="px-4 py-8 text-center text-slate-400" colSpan={6}>
                                                        No operators found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="px-4 py-3 border-t border-white/10 text-xs text-slate-400">
                                    Showing <span className="text-slate-200 font-semibold">{operators.length}</span> operator(s)
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            )}
        </div>
    );
}