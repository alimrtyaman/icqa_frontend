import { useMemo, useRef, useState } from "react";

type UploadKey = "packageExceptions" | "sortingData" | "waveExecution" | "packageDetails";

type UploadedFile = {
    name: string;
    size: number;
    updatedAt: string;
};

type Params = {
    sortingVolume: string;
    previousDpmo: string;
    problemWaveThreshold: string;
};

type View = "setup" | "results";

type WaveRow = {
    waveNo: string;
    exceptions: number;

    // display
    endTime: string;
    shelvingTime: string;

    // ✅ raw values for shift filtering
    endTimeRaw: string | null;
    shelvingTimeRaw: string | null;

    diffHours: number | null;
    status: "OK" | "ATTENTION";
};

type Results = {
    totalExceptions: number;
    dpmo: number;
    criticalWave?: { waveNo: string; exceptions: number; failures: number };
    shiftDistribution: { label: string; value: number }[];
    waves: WaveRow[];
    generatedAt: string;
};

type BackendAnalyzeResponse = {
    summary: {
        totalExceptions: number;
        matchedWaves: number;
        missingEndTimeWaves: number;
    };
    waves: Array<{
        waveNo: string;
        exceptions: number;
        endTime: string | null;
        shelvingTime: string | null;
        timeDiffHours: number | null;
    }>;
};

type Shift = "ALL" | "DAY" | "NIGHT";

function cn(...c: Array<string | false | null | undefined>) {
    return c.filter(Boolean).join(" ");
}

function formatBytes(bytes: number) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function nowStamp() {
    return new Date().toLocaleString();
}

function fmtDate(v: string | null) {
    if (!v) return "—";
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toLocaleString();
    return v;
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

/* ================= DPMO HELPERS =================
Second Sorting (simple operational model):
DPMO = (totalExceptions / sortingVolume) * 1,000,000
================================================== */

function calcDpmo(totalDefects: number, sortingVolume: number) {
    if (!sortingVolume || sortingVolume <= 0) return 0;
    return (totalDefects / sortingVolume) * 1_000_000;
}

/* ================= SHIFT HELPERS =================
DAY:   06:00 - 16:45  => shiftDate = same day
NIGHT: 18:00 - 04:45  => if time < 04:45 shiftDate = previous day
GAP:   16:45 - 18:00 and 04:45 - 06:00 => excluded (null)
================================================== */

function pad2(n: number) {
    return String(n).padStart(2, "0");
}
function toYMD(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function getShiftMeta(iso: string | null): { shift: "DAY" | "NIGHT"; shiftDate: string } | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;

    const minutes = d.getHours() * 60 + d.getMinutes();

    const DAY_START = 6 * 60; // 06:00
    const DAY_END = 16 * 60 + 45; // 16:45
    const NIGHT_START = 18 * 60; // 18:00
    const NIGHT_END = 4 * 60 + 45; // 04:45

    // DAY window
    if (minutes >= DAY_START && minutes < DAY_END) {
        return { shift: "DAY", shiftDate: toYMD(d) };
    }

    // NIGHT window (18:00 -> 24:00)
    if (minutes >= NIGHT_START) {
        return { shift: "NIGHT", shiftDate: toYMD(d) };
    }

    // NIGHT window (00:00 -> 04:45) => belongs to previous day
    if (minutes < NIGHT_END) {
        const prev = new Date(d);
        prev.setDate(prev.getDate() - 1);
        return { shift: "NIGHT", shiftDate: toYMD(prev) };
    }

    // GAP time (04:45-06:00, 16:45-18:00)
    return null;
}

/* ================= UI COMPONENTS ================= */

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
}: {
    title: string;
    description?: string;
    right?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div>
                <div className="text-sm font-semibold tracking-tight">{title}</div>
                {description ? <div className="mt-1 text-xs text-slate-400">{description}</div> : null}
            </div>
            {right}
        </div>
    );
}

function FileTile(props: {
    title: string;
    hint: string;
    value?: UploadedFile;
    badge?: "Required" | "Optional";
    onPick: (file: File) => void;
    onClear?: () => void;
}) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const isRequired = (props.badge ?? "Required") === "Required";

    return (
        <Card className="overflow-hidden">
            <CardHeader
                title={props.title}
                description={props.hint}
                right={
                    props.value ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300">
                            Uploaded
                        </span>
                    ) : (
                        <span
                            className={cn(
                                "inline-flex items-center rounded-full border px-2 py-1 text-[11px]",
                                isRequired ? "border-white/10 bg-white/5 text-slate-300" : "border-white/10 bg-transparent text-slate-400"
                            )}
                        >
                            {isRequired ? "Required" : "Optional"}
                        </span>
                    )
                }
            />

            <div className="px-5 py-4">
                {props.value ? (
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-sm font-medium text-slate-100">{props.value.name}</div>
                            <div className="mt-1 text-xs text-slate-400">
                                {formatBytes(props.value.size)} • {props.value.updatedAt}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 hover:bg-white/10 transition"
                            >
                                Replace
                            </button>
                            <button
                                type="button"
                                onClick={props.onClear}
                                className="inline-flex h-9 items-center rounded-xl border border-white/10 bg-transparent px-3 text-sm text-slate-300 hover:bg-white/5 transition"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-slate-400">Accepted: .xlsx • choose file to upload.</div>
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="inline-flex h-9 items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-500 transition"
                        >
                            Choose file
                        </button>
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        props.onPick(f);
                        e.currentTarget.value = "";
                    }}
                />
            </div>
        </Card>
    );
}

function Field(props: {
    label: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
    type?: "text" | "number";
}) {
    return (
        <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-200">{props.label}</div>
            <input
                type={props.type ?? "text"}
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
                className={cn(
                    "h-10 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100",
                    "placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
                )}
            />
            {props.hint ? <div className="text-[11px] text-slate-400">{props.hint}</div> : null}
        </div>
    );
}

/* ================= PAGE ================= */

export function SecondSortingAuditPage() {
    const [view, setView] = useState<View>("setup");
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<Results | null>(null);

    const [files, setFiles] = useState<Record<UploadKey, UploadedFile | undefined>>({
        packageExceptions: undefined,
        sortingData: undefined,
        waveExecution: undefined,
        packageDetails: undefined,
    });

    const [fileBlobs, setFileBlobs] = useState<Partial<Record<UploadKey, File>>>({});

    const [params, setParams] = useState<Params>({
        sortingVolume: "100000",
        previousDpmo: "0",
        problemWaveThreshold: "5",
    });

    // ✅ REQUIRED for this endpoint: PE + Wave Execution
    const allReady = !!fileBlobs.packageExceptions && !!fileBlobs.waveExecution;

    const statusText = running ? "RUNNING" : allReady ? "SYSTEM READY" : "MISSING INPUTS";
    const statusClass = running
        ? "border border-blue-400/20 bg-blue-400/10 text-blue-200"
        : allReady
            ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
            : "border border-white/10 bg-white/5 text-slate-300";

    // ✅ results filters (search + shift)
    const [search, setSearch] = useState("");
    const [shift, setShift] = useState<Shift>("ALL");
    const [shiftDate, setShiftDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });

    const filteredWaves = useMemo(() => {
        if (!results) return [];

        const q = search.trim().toLowerCase();

        return results.waves.filter((w) => {
            if (q && !w.waveNo.toLowerCase().includes(q)) return false;

            if (shift === "ALL") return true;

            const meta = getShiftMeta(w.endTimeRaw ?? w.shelvingTimeRaw);
            if (!meta) return false; // GAP or missing time excluded

            if (meta.shift !== shift) return false;
            if (meta.shiftDate !== shiftDate) return false;

            return true;
        });
    }, [results, search, shift, shiftDate]);

    async function onRun() {
        if (!allReady) return;

        const exceptionFile = fileBlobs.packageExceptions!;
        const waveExecutionFile = fileBlobs.waveExecution!;

        setRunning(true);
        setResults(null);

        try {
            const fd = new FormData();
            fd.append("exceptionFile", exceptionFile);
            fd.append("waveFile", waveExecutionFile);

            const res = await fetch("/api/audits/second-sorting/analyze", {
                method: "POST",
                body: fd,
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`HTTP ${res.status}: ${txt}`);
            }

            const json = (await res.json()) as BackendAnalyzeResponse;

            const threshold = Math.max(1, Number(params.problemWaveThreshold || 5));

            const waves: WaveRow[] = json.waves.map((w) => ({
                waveNo: w.waveNo,
                exceptions: w.exceptions,

                endTime: fmtDate(w.endTime),
                shelvingTime: fmtDate(w.shelvingTime),

                endTimeRaw: w.endTime,
                shelvingTimeRaw: w.shelvingTime,

                diffHours: w.timeDiffHours,
                status: w.exceptions >= threshold ? "ATTENTION" : "OK",
            }));

            const totalExceptions = json.summary.totalExceptions;

            // ✅ DPMO calculation (simple model)
            const sortingVolume = Math.max(0, Number(params.sortingVolume || 0));
            const dpmo = calcDpmo(totalExceptions, sortingVolume);

            const critical = waves
                .filter((w) => w.status === "ATTENTION")
                .sort((a, b) => b.exceptions - a.exceptions)[0];

            const mapped: Results = {
                totalExceptions,
                dpmo: Math.round(dpmo), // ✅ filled
                criticalWave: critical
                    ? { waveNo: critical.waveNo, exceptions: critical.exceptions, failures: critical.exceptions }
                    : undefined,
                shiftDistribution: [],
                waves,
                generatedAt: nowStamp(),
            };

            setResults(mapped);
            setView("results");
        } catch (e: any) {
            console.error(e);
            alert(e?.message ?? "Request failed");
        } finally {
            setRunning(false);
        }
    }

    if (view === "setup") {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="text-2xl font-bold tracking-tight">Second Sorting Audit</div>
                        <div className="mt-1 text-sm text-slate-400">Upload required files, tune thresholds, then run the audit.</div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs", statusClass)}>{statusText}</span>

                        <button
                            type="button"
                            disabled={!allReady || running}
                            onClick={onRun}
                            className={cn(
                                "h-9 rounded-xl px-3 text-sm font-medium transition",
                                allReady && !running ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-white/10 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            {running ? "Running..." : "Run Analysis"}
                        </button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                    <div className="lg:col-span-7 space-y-4">
                        <Card className="overflow-hidden">
                            <CardHeader title="Main Analysis Files" description="" />
                            <div className="px-5 py-5 grid gap-4 md:grid-cols-2">
                                <FileTile
                                    title="Package Exception Data (PE)"
                                    hint="Required (.xlsx)"
                                    badge="Required"
                                    value={files.packageExceptions}
                                    onPick={(f) => {
                                        setFiles((p) => ({ ...p, packageExceptions: { name: f.name, size: f.size, updatedAt: nowStamp() } }));
                                        setFileBlobs((p) => ({ ...p, packageExceptions: f }));
                                    }}
                                    onClear={() => {
                                        setFiles((p) => ({ ...p, packageExceptions: undefined }));
                                        setFileBlobs((p) => {
                                            const { packageExceptions, ...rest } = p;
                                            return rest;
                                        });
                                    }}
                                />

                                <FileTile
                                    title="3D Data"
                                    hint="Required (.xlsx)"
                                    badge="Required"
                                    value={files.waveExecution}
                                    onPick={(f) => {
                                        setFiles((p) => ({ ...p, waveExecution: { name: f.name, size: f.size, updatedAt: nowStamp() } }));
                                        setFileBlobs((p) => ({ ...p, waveExecution: f }));
                                    }}
                                    onClear={() => {
                                        setFiles((p) => ({ ...p, waveExecution: undefined }));
                                        setFileBlobs((p) => {
                                            const { waveExecution, ...rest } = p;
                                            return rest;
                                        });
                                    }}
                                />
                            </div>

                            <div className="px-5 pb-5 text-[11px] text-slate-400">
                                Required to run: <span className="text-slate-200">PE</span> + <span className="text-slate-200">3D</span>.
                            </div>
                        </Card>

                        <Card className="overflow-hidden">
                            <CardHeader
                                title="Additional Inputs (Optional)"
                                description="Not used in v1 analysis."
                                right={
                                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300">
                                        Module
                                    </span>
                                }
                            />
                            <div className="px-5 py-5 grid gap-4 md:grid-cols-2">
                                <FileTile
                                    title="Wave Exception"
                                    hint="Optional"
                                    badge="Optional"
                                    value={files.sortingData}
                                    onPick={(f) => setFiles((p) => ({ ...p, sortingData: { name: f.name, size: f.size, updatedAt: nowStamp() } }))}
                                    onClear={() => setFiles((p) => ({ ...p, sortingData: undefined }))}
                                />

                                <FileTile
                                    title="Package Detail"
                                    hint="Optional"
                                    badge="Optional"
                                    value={files.packageDetails}
                                    onPick={(f) => setFiles((p) => ({ ...p, packageDetails: { name: f.name, size: f.size, updatedAt: nowStamp() } }))}
                                    onClear={() => setFiles((p) => ({ ...p, packageDetails: undefined }))}
                                />
                            </div>

                            <div className="px-5 pb-5 text-[11px] text-slate-400"></div>
                        </Card>
                    </div>

                    <div className="lg:col-span-5 space-y-4">
                        <Card className="overflow-hidden">
                            <CardHeader title="Analysis Parameters" description="Customize reporting thresholds." />
                            <div className="px-5 py-5 space-y-4">
                                <Field
                                    label="Sorting Volume"
                                    type="number"
                                    value={params.sortingVolume}
                                    onChange={(v) => setParams((p) => ({ ...p, sortingVolume: v }))}
                                    hint="Used for DPMO: (Total Exceptions / Sorting Volume) × 1,000,000"
                                />
                                <Field
                                    label="Previous DPMO"
                                    type="number"
                                    value={params.previousDpmo}
                                    onChange={(v) => setParams((p) => ({ ...p, previousDpmo: v }))}
                                    hint="(Not used yet.)"
                                />
                                <Field
                                    label="Problem Wave Threshold"
                                    type="number"
                                    value={params.problemWaveThreshold}
                                    onChange={(v) => setParams((p) => ({ ...p, problemWaveThreshold: v }))}
                                    hint="Minimum exceptions to mark as problem wave."
                                />

                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <button
                                        type="button"
                                        className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 hover:bg-white/10 transition"
                                        onClick={() => setParams({ sortingVolume: "100000", previousDpmo: "0", problemWaveThreshold: "5" })}
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!allReady || running}
                                        className={cn(
                                            "h-10 rounded-xl px-3 text-sm font-medium transition",
                                            allReady && !running ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-white/10 text-slate-400 cursor-not-allowed"
                                        )}
                                        onClick={onRun}
                                    >
                                        {running ? "Running..." : "Run Analysis"}
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // RESULTS VIEW
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="text-2xl font-bold tracking-tight">Analysis Results</div>
                    <div className="mt-1 text-sm text-slate-400">
                        Wave-by-wave performance data • Last updated: {results?.generatedAt ?? "—"}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-200 hover:bg-white/10 transition"
                        onClick={() => setView("setup")}
                    >
                        Back to Setup
                    </button>

                    <button
                        type="button"
                        className="h-9 rounded-xl bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-500 transition"
                        onClick={() => downloadCSV("second-sorting-waves.csv", results?.waves ?? [])}
                        disabled={!results}
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                    <Card className="overflow-hidden">
                        <CardHeader title="Quick Metrics" />
                        <div className="px-5 py-4 grid grid-cols-2 gap-4">
                            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                                <div className="text-[11px] text-slate-400">TOTAL EXCEPTIONS</div>
                                <div className="mt-1 text-3xl font-bold">{results?.totalExceptions ?? "—"}</div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                                <div className="text-[11px] text-slate-400">DPMO</div>
                                <div className="mt-1 text-3xl font-bold text-emerald-400">{results?.dpmo ?? "—"}</div>
                            </div>
                        </div>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader title="Critical Wave" description="Attention required (threshold exceeded)." />
                        <div className="px-5 py-4">
                            {results?.criticalWave ? (
                                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
                                    <div className="text-sm font-semibold">{results.criticalWave.waveNo}</div>
                                    <div className="mt-2 text-xs text-slate-300">
                                        Exceptions: <span className="font-medium text-white">{results.criticalWave.exceptions}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-slate-300">
                                        Failures: <span className="font-medium text-white">{results.criticalWave.failures}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-400">No problem waves detected.</div>
                            )}
                        </div>
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader title="Distribution Breakdown" description="(Not used in v1)" />
                        <div className="px-5 py-4">
                            <div className="text-sm text-slate-400">Not calculated in v1.</div>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-8 space-y-4">
                    <Card className="overflow-hidden">
                        <CardHeader
                            title="Waves"
                            description="Wave table (search + export)."
                            right={
                                <div className="flex items-center gap-2">
                                    <select
                                        value={shift}
                                        onChange={(e) => setShift(e.target.value as Shift)}
                                        className={cn(
                                            "h-9 rounded-xl border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-600/40"
                                        )}
                                    >
                                        <option value="ALL">ALL</option>
                                        <option value="DAY">DAY (06:00–16:45)</option>
                                        <option value="NIGHT">NIGHT (18:00–04:45)</option>
                                    </select>

                                    <input
                                        type="date"
                                        value={shiftDate}
                                        onChange={(e) => setShiftDate(e.target.value)}
                                        className={cn(
                                            "h-9 rounded-xl border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-600/40"
                                        )}
                                    />

                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search wave..."
                                        className={cn(
                                            "h-9 w-56 rounded-xl border border-white/10 bg-slate-950/40 px-3 text-sm text-slate-100",
                                            "placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
                                        )}
                                    />
                                </div>
                            }
                        />

                        <div className="px-5 py-4">
                            <div className="overflow-hidden rounded-xl border border-white/10">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5 text-xs text-slate-300">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium">Wave No</th>
                                            <th className="px-3 py-2 text-right font-medium">Exceptions</th>
                                            <th className="px-3 py-2 text-left font-medium">End Time</th>
                                            <th className="px-3 py-2 text-left font-medium">Shelving Time</th>
                                            <th className="px-3 py-2 text-right font-medium">Diff (h)</th>
                                            <th className="px-3 py-2 text-right font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {filteredWaves.map((w) => (
                                            <tr key={w.waveNo} className="hover:bg-white/5 transition">
                                                <td className="px-3 py-2 text-slate-100">{w.waveNo}</td>
                                                <td className="px-3 py-2 text-right text-slate-200">{w.exceptions}</td>
                                                <td className="px-3 py-2 text-slate-300">{w.endTime}</td>
                                                <td className="px-3 py-2 text-slate-300">{w.shelvingTime}</td>
                                                <td className="px-3 py-2 text-right text-slate-200">
                                                    {w.diffHours == null ? "—" : w.diffHours.toFixed(1)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center rounded-full px-2 py-1 text-[11px]",
                                                            w.status === "ATTENTION"
                                                                ? "border border-rose-500/20 bg-rose-500/10 text-rose-200"
                                                                : "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                                                        )}
                                                    >
                                                        {w.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}

                                        {filteredWaves.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                                                    No waves found.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-3 text-[11px] text-slate-500">
                                If results are 0, verify PE file has Wave + Time columns.
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}