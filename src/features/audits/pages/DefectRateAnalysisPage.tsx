import { useEffect, useMemo, useRef, useState } from "react";
import {
    UploadCloud,
    Play,
    TrendingUp,
    Activity,
    RotateCcw,
    Download,
    AlertTriangle,
    BadgeCheck,
    FileText,
} from "lucide-react";

type ReportMode = "NORMAL" | "DAILY";

type UploadedFile = {
    file: File;
    name: string;
    size: number;
    uploadedAt: string;
};

type Result = {
    totalDefects: number;
    packedVolume: number; // ✅ FIX: added
    dpmo: number;
    defectRatePct: number;
    trend: "UP" | "DOWN" | "FLAT";
    generatedAt: string;
};

type HistoryPoint = { ts: number; dpmo: number };

const LS_KEY = "icqa_defect_rate_history_v1";

function cn(...c: Array<string | false | null | undefined>) {
    return c.filter(Boolean).join(" ");
}

function nowStamp() {
    return new Date().toLocaleString();
}

function formatBytes(bytes: number) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function downloadCSV(filename: string, rows: any[]) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0] ?? {});
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function Sparkline({ values }: { values: number[] }) {
    const w = 220;
    const h = 54;
    if (!values.length) return <div className="text-xs text-slate-500">No data</div>;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const denom = max - min || 1;

    const pts = values.map((v, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * (w - 2) + 1;
        const y = h - 1 - ((v - min) / denom) * (h - 10) - 4;
        return `${x},${y}`;
    });

    return (
        <svg width={w} height={h} className="block">
            <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400/90" />
            <circle
                cx={pts[pts.length - 1].split(",")[0]}
                cy={pts[pts.length - 1].split(",")[1]}
                r="3"
                className="fill-blue-300"
            />
        </svg>
    );
}

function MiniBars({ values }: { values: number[] }) {
    if (!values.length) return null;
    const max = Math.max(...values) || 1;

    return (
        <div className="flex items-end gap-1.5">
            {values.map((v, i) => {
                const pct = (v / max) * 100;
                return (
                    <div
                        key={i}
                        className="w-3 rounded-md border border-white/10 bg-white/5"
                        style={{ height: `${clamp(pct, 8, 100)}%` }}
                        title={`${v.toFixed(2)}`}
                    />
                );
            })}
        </div>
    );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-white/10 bg-white/5 backdrop-blur",
                "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
                className
            )}
        >
            {children}
        </div>
    );
}

function CardHeader({
    title,
    description,
    right,
    icon,
}: {
    title: string;
    description?: string;
    right?: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div className="flex items-start gap-3">
                {icon ? (
                    <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-white/5 border border-white/10">
                        {icon}
                    </div>
                ) : null}
                <div>
                    <div className="text-sm font-semibold tracking-tight">{title}</div>
                    {description ? <div className="mt-1 text-xs text-slate-400">{description}</div> : null}
                </div>
            </div>
            {right}
        </div>
    );
}

export default function DefectRateAnalysisPage() {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [file, setFile] = useState<UploadedFile | null>(null);
    const [drag, setDrag] = useState(false);

    const [mode, setMode] = useState<ReportMode>("NORMAL");
    const [packedVolume, setPackedVolume] = useState("100000");
    const [previousDpmo, setPreviousDpmo] = useState("");

    const [running, setRunning] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const [error, setError] = useState("");

    const [history, setHistory] = useState<HistoryPoint[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as HistoryPoint[];
                if (Array.isArray(parsed) && parsed.length) {
                    setHistory(parsed.slice(-20));
                    return;
                }
            }
        } catch { }

        const base = 110;
        const seed: HistoryPoint[] = Array.from({ length: 10 }).map((_, i) => ({
            ts: Date.now() - (10 - i) * 3600_000,
            dpmo: clamp(base + (Math.sin(i * 0.9) * 25 + (i % 3) * 6), 40, 220),
        }));
        setHistory(seed);
        localStorage.setItem(LS_KEY, JSON.stringify(seed));
    }, []);

    const packed = useMemo(() => Number(packedVolume), [packedVolume]);
    const prev = useMemo(() => (previousDpmo.trim() ? Number(previousDpmo) : null), [previousDpmo]);

    const ready = useMemo(() => {
        if (!file) return false;
        if (!packedVolume.trim()) return false;
        if (!Number.isFinite(packed) || packed <= 0) return false;
        if (prev !== null && (!Number.isFinite(prev) || prev < 0)) return false;
        return true;
    }, [file, packedVolume, packed, prev]);

    const statusText = running ? "RUNNING" : ready ? "SYSTEM READY" : "MISSING INPUTS";
    const statusClass = running
        ? "border border-blue-400/20 bg-blue-400/10 text-blue-200"
        : ready
            ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
            : "border border-white/10 bg-white/5 text-slate-300";

    function pickFile(f: File) {
        setError("");
        setResult(null);

        const ok =
            f.name.toLowerCase().endsWith(".xlsx") ||
            f.name.toLowerCase().endsWith(".xls") ||
            f.name.toLowerCase().endsWith(".csv");

        if (!ok) {
            setError("Unsupported file type. Please upload .xlsx / .xls / .csv");
            return;
        }

        const maxMb = 15;
        if (f.size / (1024 * 1024) > maxMb) {
            setError(`File too large. Max ${maxMb}MB`);
            return;
        }

        setFile({ file: f, name: f.name, size: f.size, uploadedAt: nowStamp() });
    }

    function resetAll() {
        setFile(null);
        setMode("NORMAL");
        setPackedVolume("100000");
        setPreviousDpmo("");
        setRunning(false);
        setResult(null);
        setError("");
    }

    function computeMetrics() {
        const seed = (file?.size ?? 12345) % 997;
        const baseDefects = clamp(Math.floor(seed / 7) + 8, 3, 260);
        const defects = clamp(Math.floor(baseDefects * (mode === "DAILY" ? 0.7 : 1)), 1, 9999);

        const dpmo = (defects / packed) * 1_000_000;
        const defectRatePct = (defects / packed) * 100;

        let trend: Result["trend"] = "FLAT";
        if (prev !== null) {
            if (dpmo > prev * 1.03) trend = "UP";
            else if (dpmo < prev * 0.97) trend = "DOWN";
        } else {
            const last = history[history.length - 1]?.dpmo;
            if (typeof last === "number") {
                if (dpmo > last * 1.03) trend = "UP";
                else if (dpmo < last * 0.97) trend = "DOWN";
            }
        }

        return {
            defects,
            dpmo: Number(dpmo.toFixed(2)),
            defectRatePct: Number(defectRatePct.toFixed(4)),
            trend,
        };
    }

    async function runAnalysis() {
        if (!ready || !file) return;

        setRunning(true);
        setError("");
        setResult(null);

        await new Promise((r) => setTimeout(r, 1100));

        const m = computeMetrics();

        const newPoint: HistoryPoint = { ts: Date.now(), dpmo: m.dpmo };
        const nextHistory = [...history, newPoint].slice(-20);
        setHistory(nextHistory);
        localStorage.setItem(LS_KEY, JSON.stringify(nextHistory));

        setResult({
            totalDefects: m.defects,
            packedVolume: packed,
            dpmo: m.dpmo,
            defectRatePct: m.defectRatePct,
            trend: m.trend,
            generatedAt: nowStamp(),
        });

        setRunning(false);
    }

    const last10 = history.slice(-10);
    const last10Dpmo = last10.map((x) => x.dpmo);
    const lastDpmo = last10Dpmo[last10Dpmo.length - 1];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-transparent p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="text-2xl font-bold tracking-tight">Defect Rate Analysis</div>
                        <div className="mt-1 text-sm text-slate-400">Upload report • set volume • generate metrics</div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={resetAll}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 hover:bg-white/10 transition"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset
                        </button>

                        <button
                            type="button"
                            disabled={!ready || running}
                            onClick={runAnalysis}
                            className={cn(
                                "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition",
                                ready && !running ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-white/10 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            <Play className="h-4 w-4" />
                            {running ? "Running..." : "Run Analysis"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="overflow-hidden">
                        <CardHeader
                            title="Select Exception Report"
                            description="UPLOAD EXCEPTION REPORT EXPORT (.XLSX, .CSV)"
                            icon={<FileText className="h-4 w-4 text-slate-200" />}
                            right={<span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs", statusClass)}>{statusText}</span>}
                        />

                        <div className="px-5 py-5">
                            <div
                                onClick={() => inputRef.current?.click()}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDrag(true);
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDrag(true);
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDrag(false);
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDrag(false);
                                    const f = e.dataTransfer.files?.[0];
                                    if (f) pickFile(f);
                                }}
                                className={cn(
                                    "rounded-2xl border border-dashed p-10 text-center transition cursor-pointer",
                                    drag ? "border-slate-400 bg-slate-950/40" : "border-white/10 bg-slate-950/20"
                                )}
                            >
                                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/5 border border-white/10">
                                    <UploadCloud className="h-5 w-5 text-slate-200" />
                                </div>

                                <div className="text-sm font-semibold text-slate-100">
                                    {file ? `Selected: ${file.name}` : "Click to upload or drag and drop"}
                                </div>
                                <div className="mt-1 text-xs text-slate-400">
                                    Export data from <span className="text-slate-200 underline underline-offset-2">Exception Report</span> in WMS
                                </div>
                                <div className="mt-2 text-[11px] text-slate-500">SUPPORTS CSV, XLSX • MAX 15MB</div>

                                {file ? (
                                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                                        <BadgeCheck className="h-4 w-4" />
                                        {formatBytes(file.size)} • {file.uploadedAt}
                                    </div>
                                ) : null}

                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) pickFile(f);
                                        e.currentTarget.value = "";
                                    }}
                                />
                            </div>

                            {error ? (
                                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {error}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="overflow-hidden">
                            <CardHeader title="Report Mode" description="SELECT ANALYSIS TYPE" icon={<Activity className="h-4 w-4 text-slate-200" />} />
                            <div className="px-5 py-5">
                                <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-slate-950/30 p-1">
                                    {(["NORMAL", "DAILY"] as const).map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setMode(m)}
                                            className={cn(
                                                "h-9 rounded-lg text-xs font-semibold transition",
                                                mode === m ? "bg-white/10 text-slate-100" : "text-slate-400 hover:text-slate-200"
                                            )}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 text-[11px] text-slate-500">DAILY = smaller window (trend moves faster)</div>
                            </div>
                        </Card>

                        <Card className="overflow-hidden">
                            <CardHeader title="Packed Volume" description="REQUIRED • FOR DEFECT RATE" icon={<Activity className="h-4 w-4 text-slate-200" />} />
                            <div className="px-5 py-5 space-y-2">
                                <input
                                    value={packedVolume}
                                    onChange={(e) => setPackedVolume(e.target.value.replace(/[^\d]/g, ""))}
                                    placeholder="Enter packed volume..."
                                    className={cn(
                                        "h-10 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100",
                                        "placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
                                    )}
                                />
                                <div className="text-[11px] text-slate-500">Example: 120000</div>
                            </div>
                        </Card>

                        <Card className="overflow-hidden">
                            <CardHeader title="Previous DPMO" description="OPTIONAL • FOR TREND CALC" icon={<TrendingUp className="h-4 w-4 text-slate-200" />} />
                            <div className="px-5 py-5 space-y-2">
                                <input
                                    value={previousDpmo}
                                    onChange={(e) => setPreviousDpmo(e.target.value.replace(/[^\d.]/g, ""))}
                                    placeholder="Enter previous DPMO..."
                                    className={cn(
                                        "h-10 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100",
                                        "placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
                                    )}
                                />
                                <div className="text-[11px] text-slate-500">Leave empty if not needed</div>
                            </div>
                        </Card>
                    </div>

                    {result ? (
                        <Card className="overflow-hidden">
                            <CardHeader
                                title="Result"
                                description={`Generated at: ${result.generatedAt}`}
                                right={
                                    <button
                                        type="button"
                                        onClick={() =>
                                            downloadCSV("defect-rate-result.csv", [
                                                {
                                                    totalDefects: result.totalDefects,
                                                    packedVolume: result.packedVolume,
                                                    dpmo: result.dpmo,
                                                    defectRatePct: result.defectRatePct,
                                                    trend: result.trend,
                                                    generatedAt: result.generatedAt,
                                                    mode,
                                                    file: file?.name ?? "",
                                                },
                                            ])
                                        }
                                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 hover:bg-white/10 transition"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export CSV
                                    </button>
                                }
                            />
                            <div className="px-5 py-5 grid gap-4 md:grid-cols-4">
                                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                                    <div className="text-[11px] text-slate-400">TOTAL DEFECTS</div>
                                    <div className="mt-1 text-2xl font-semibold">{result.totalDefects}</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                                    <div className="text-[11px] text-slate-400">PACKED VOLUME</div>
                                    <div className="mt-1 text-2xl font-semibold">{result.packedVolume}</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                                    <div className="text-[11px] text-slate-400">DPMO</div>
                                    <div className="mt-1 text-2xl font-semibold text-blue-300">{result.dpmo}</div>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                                    <div className="text-[11px] text-slate-400">DEFECT RATE</div>
                                    <div className="mt-1 text-2xl font-semibold">{result.defectRatePct}%</div>
                                </div>
                            </div>
                        </Card>
                    ) : null}
                </div>

                {/* Right */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="overflow-hidden">
                        <CardHeader
                            title="Performance History"
                            description="Last 10 runs • DPMO"
                            icon={<TrendingUp className="h-4 w-4 text-slate-200" />}
                            right={
                                <span className="text-xs text-slate-400">
                                    Latest: <span className="text-slate-200 font-semibold">{lastDpmo?.toFixed?.(2) ?? "—"}</span>
                                </span>
                            }
                        />
                        <div className="px-5 py-5 space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                                <div className="text-[11px] text-slate-400">SPARKLINE</div>
                                <div className="mt-2 text-blue-300">
                                    <Sparkline values={last10Dpmo} />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-[11px] text-slate-400">MINI BARS</div>
                                    <div className="text-[11px] text-slate-500">{last10Dpmo.length} pts</div>
                                </div>
                                <div className="mt-3 h-20">
                                    <MiniBars values={last10Dpmo} />
                                </div>
                            </div>

                            <div className="text-[11px] text-slate-500">
                                Tip: Each run appends a new point to history automatically.
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}