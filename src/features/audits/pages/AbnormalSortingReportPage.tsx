import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Upload, Search, X, Sparkles } from "lucide-react";
import { apiPostMultipart } from "../../../lib/api";

type SessionStats = { volume: number; avgUph: number };

type Row = {
    operator: string;
    sku: number;
    time: string;
    uph: number;
};

type AbnormalSortingResponse = {
    session: SessionStats;
    topPerformers: { byUph: Row[]; bySku: Row[] };
    results: Row[];
};

function cn(...classes: (string | false | null | undefined)[]) {
    return classes.filter(Boolean).join(" ");
}

function RankDot({ i }: { i: 1 | 2 | 3 }) {
    const cls =
        i === 1
            ? "border-yellow-500/30 text-yellow-300 bg-yellow-500/10"
            : i === 2
                ? "border-white/15 text-slate-200 bg-white/5"
                : "border-orange-500/30 text-orange-300 bg-orange-500/10";

    return (
        <span className={cn("h-7 w-7 grid place-items-center rounded-full border text-xs font-bold", cls)}>
            {i}
        </span>
    );
}

function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-5">
            <div className="text-[11px] font-semibold tracking-wide text-slate-400 text-center">
                {label.toUpperCase()}
            </div>
            <div className="mt-2 text-center text-4xl font-extrabold tracking-tight text-blue-400">
                {value}
            </div>
        </div>
    );
}

export default function AbnormalSortingReportPage() {
    const fileRef = useRef<HTMLInputElement | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [data, setData] = useState<AbnormalSortingResponse | null>(null);

    // ✅ phases for nice UX
    const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");

    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        if (!data) return [];
        const q = query.trim().toLowerCase();
        if (!q) return data.results;

        return data.results.filter((r) => {
            return (
                r.operator.toLowerCase().includes(q) ||
                String(r.sku).includes(q) ||
                String(r.uph).includes(q) ||
                r.time.toLowerCase().includes(q)
            );
        });
    }, [data, query]);

    function resetAll() {
        setFile(null);
        setData(null);
        setQuery("");
        setErr(null);
        setPhase("idle");
        if (fileRef.current) fileRef.current.value = "";
    }

    async function analyze() {
        if (!file) return;
        setLoading(true);
        setErr(null);
        setPhase("scanning");

        try {
            const form = new FormData();
            form.append("file", file);

            const json = await apiPostMultipart<AbnormalSortingResponse>(
                "/api/audits/abnormal-sorting/analyze",
                form
            );

            setData(json);
            setPhase("done");
        } catch (e: any) {
            setErr(e?.message || "Analysis failed.");
            setPhase("idle");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="pb-10">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="text-2xl font-extrabold tracking-tight">Abnormal Sorting Analysis</div>
                </div>

                {data ? (
                    <button
                        type="button"
                        onClick={resetAll}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                    >
                        <X size={16} />
                        Reset
                    </button>
                ) : null}
            </div>

            {/* Upload */}
            {!data && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-xl border border-white/10 bg-white/5 p-2">
                            <FileSpreadsheet size={18} className="text-slate-300" />
                        </div>

                        <div className="flex-1">
                            <div className="text-sm font-semibold text-white/90">Upload Excel (.xlsx)</div>
                            <div className="mt-1 text-xs text-slate-400">
                                Single file upload. Backend returns stats and results.
                            </div>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".xlsx"
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-xl file:border file:border-white/10 file:bg-white/5 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-200 hover:file:bg-white/10"
                                />

                                <button
                                    type="button"
                                    onClick={analyze}
                                    disabled={!file || loading}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-blue-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed sm:w-[190px]"
                                >
                                    <Upload size={16} />
                                    {loading ? "Analyzing..." : "Analyze"}
                                </button>
                            </div>

                            {file && (
                                <div className="mt-2 text-xs text-slate-400">
                                    Selected: <span className="text-slate-200">{file.name}</span>
                                </div>
                            )}

                            {/* ✅ Scanning animation */}
                            {phase === "scanning" && (
                                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 overflow-hidden relative">
                                    <div className="flex items-center gap-2 text-slate-200 font-semibold">
                                        <Sparkles size={18} className="text-emerald-300" />
                                        Analyzing inventory…
                                    </div>
                                    <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                                        <div className="h-full w-1/2 bg-emerald-400/80 animate-[scan_1.2s_ease-in-out_infinite]" />
                                    </div>
                                    <div className="mt-3 text-xs text-slate-400">
                                        Comparing counts • Detecting variances • Building report
                                    </div>

                                    <style>{`
                    @keyframes scan {
                      0% { transform: translateX(-60%); }
                      100% { transform: translateX(220%); }
                    }
                  `}</style>
                                </div>
                            )}

                            {err && <div className="mt-3 text-sm text-red-300">{err}</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {data &&
                (() => {
                    const toMinutes = (hhmm: string) => {
                        if (!hhmm) return 0;
                        const [hStr, mStr] = hhmm.split(":");
                        const h = Number(hStr || 0);
                        const m = Number(mStr || 0);
                        return h * 60 + m;
                    };

                    const above30 = filtered.filter((r) => toMinutes(r.time) >= 30);
                    const below30 = filtered.filter((r) => toMinutes(r.time) < 30);

                    return (
                        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
                            {/* Left */}
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-sm font-bold text-white/90">Session</div>
                                    <div className="mt-4 flex gap-3">
                                        <StatBox label="Volume" value={data.session.volume} />
                                        <StatBox label="Avg UPH" value={data.session.avgUph} />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-sm font-bold text-white/90">Top performers</div>

                                    <div className="mt-4">
                                        <div className="text-[11px] font-semibold text-slate-400">TOP 3 BY UPH</div>
                                        <div className="mt-2 space-y-2">
                                            {data.topPerformers.byUph.slice(0, 3).map((r, idx) => (
                                                <div
                                                    key={`uph-${r.operator}-${idx}`}
                                                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <RankDot i={(idx + 1) as 1 | 2 | 3} />
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-semibold text-slate-100">{r.operator}</div>
                                                            <div className="text-[11px] text-slate-400">SKU: {r.sku}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-bold text-blue-300">{r.uph}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="my-4 h-px bg-white/10" />

                                    <div>
                                        <div className="text-[11px] font-semibold text-slate-400">TOP 3 BY SKUS</div>
                                        <div className="mt-2 space-y-2">
                                            {data.topPerformers.bySku.slice(0, 3).map((r, idx) => (
                                                <div
                                                    key={`sku-${r.operator}-${idx}`}
                                                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <RankDot i={(idx + 1) as 1 | 2 | 3} />
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-semibold text-slate-100">{r.operator}</div>
                                                            <div className="text-[11px] text-slate-400">UPH: {r.uph}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-bold text-emerald-300">{r.sku}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
                                    <div className="text-sm font-bold text-white/90">Results</div>

                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Search"
                                            className="w-[220px] rounded-full border border-white/10 bg-black/20 pl-9 pr-3 py-1.5 text-sm text-slate-100 outline-none focus:border-white/20"
                                        />
                                    </div>
                                </div>

                                {/* Results (>= 30 min) */}
                                <div className="px-4 pt-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold text-white/80 tracking-wide">RESULTS (≥ 30 MIN)</div>
                                        <div className="text-xs text-slate-400">
                                            <span className="text-slate-200 font-semibold">{above30.length}</span> operators
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-black/20 text-slate-400">
                                            <tr className="[&>th]:px-4 [&>th]:py-3 text-left">
                                                <th>OPERATOR</th>
                                                <th className="text-right">SKU</th>
                                                <th className="text-right">TIME</th>
                                                <th className="text-right">UPH</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {above30.map((r) => (
                                                <tr key={`a30-${r.operator}-${r.sku}-${r.time}`} className="hover:bg-white/5">
                                                    <td className="px-4 py-3 font-semibold text-slate-100">{r.operator}</td>
                                                    <td className="px-4 py-3 text-right text-slate-200 tabular-nums">{r.sku}</td>
                                                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{r.time}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-100 tabular-nums">{r.uph}</td>
                                                </tr>
                                            ))}

                                            {above30.length === 0 && (
                                                <tr>
                                                    <td className="px-4 py-8 text-center text-slate-400" colSpan={4}>
                                                        No operators ≥ 30 minutes.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Short time participants (< 30 min) */}
                                <div className="px-4 pt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold text-white/80 tracking-wide">
                                            SHORT TIME PARTICIPANTS (&lt; 30 MIN)
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            <span className="text-slate-200 font-semibold">{below30.length}</span> operators
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-black/20 text-slate-400">
                                            <tr className="[&>th]:px-4 [&>th]:py-3 text-left">
                                                <th>OPERATOR</th>
                                                <th className="text-right">SKU</th>
                                                <th className="text-right">TIME</th>
                                                <th className="text-right">UPH</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {below30.map((r) => (
                                                <tr key={`b30-${r.operator}-${r.sku}-${r.time}`} className="hover:bg-white/5">
                                                    <td className="px-4 py-3 font-semibold text-slate-100">{r.operator}</td>
                                                    <td className="px-4 py-3 text-right text-slate-200 tabular-nums">{r.sku}</td>
                                                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{r.time}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-100 tabular-nums">{r.uph}</td>
                                                </tr>
                                            ))}

                                            {below30.length === 0 && (
                                                <tr>
                                                    <td className="px-4 py-8 text-center text-slate-400" colSpan={4}>
                                                        No short-time participants.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })()}
        </div>
    );
}