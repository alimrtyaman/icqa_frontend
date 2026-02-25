import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";

interface Point {
    date: string;
    abnormalSecondSortingSku: number;
    inventorySku: number;
}

type DonutItem = { name: string; value: number };

const pad = (n: number) => String(n).padStart(2, "0");
const toIsoDate = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const subDays = (base: Date, days: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() - days);
    return d;
};

const INVENTORY_COLOR = "#2F6BFF";
const ABNORMAL_COLOR = "#27C6C0";

const DonutTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];

    return (
        <div className="rounded-xl border border-white/10 bg-black/80 px-4 py-3 backdrop-blur-xl">
            <div className="text-xs font-bold text-zinc-400">{p.name}</div>
            <div className="text-lg font-black text-white mt-1">
                {Number(p.value).toLocaleString()}
            </div>
        </div>
    );
};

export function OperationalOverviewPage() {
    const [range, setRange] = useState<"7d" | "14d" | "30d">("14d");
    const [data, setData] = useState<Point[]>([]);

    const { start, end } = useMemo(() => {
        const today = new Date();
        const endIso = toIsoDate(today);
        const days = range === "7d" ? 6 : range === "14d" ? 13 : 29;
        const startIso = toIsoDate(subDays(today, days));
        return { start: startIso, end: endIso };
    }, [range]);

    useEffect(() => {
        fetch(`/api/work-efficiency/metrics?start=${start}&end=${end}`)
            .then((r) => r.json())
            .then((res: Point[]) => {
                setData([...res].sort((a, b) => a.date.localeCompare(b.date)));
            });
    }, [start, end]);

    const totals = useMemo(
        () => ({
            abnormal: data.reduce((s, p) => s + p.abnormalSecondSortingSku, 0),
            inventory: data.reduce((s, p) => s + p.inventorySku, 0),
        }),
        [data]
    );

    const donutData: DonutItem[] = [
        { name: "Inventory SKU", value: totals.inventory },
        { name: "Abnormal SKU", value: totals.abnormal },
    ];

    return (
        <div className="min-h-screen bg-[#050505] p-6 md:p-12 font-sans text-zinc-300">
            <div className="mx-auto max-w-7xl space-y-10">

                {/* HEADER */}
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <Activity size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white">
                                Live Operations
                            </h1>
                            <div className="text-xs font-bold text-zinc-500 mt-1">
                                {start} / {end}
                            </div>
                        </div>
                    </div>

                    {/* RANGE SELECTOR */}
                    <div className="flex bg-zinc-900/40 p-1.5 rounded-xl border border-white/5">
                        {(["7d", "14d", "30d"] as const).map((k) => (
                            <button
                                key={k}
                                onClick={() => setRange(k)}
                                className={`px-5 py-2 text-xs font-bold rounded-lg transition ${range === k
                                        ? "bg-white text-black"
                                        : "text-zinc-500 hover:text-white"
                                    }`}
                            >
                                {k.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DONUT SECTION */}
                <div className="rounded-[36px] border border-white/5 bg-zinc-900/10 p-10">
                    <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_600px_1fr] items-center">

                        {/* LEFT METRIC */}
                        <div className="flex flex-col items-center xl:items-end text-center xl:text-right">
                            <div className="flex items-center gap-4">
                                <div
                                    className="h-4 w-4 rounded-full"
                                    style={{ backgroundColor: INVENTORY_COLOR }}
                                />
                                <div className="text-sm font-bold text-zinc-400">
                                    Inventory SKU
                                </div>
                            </div>
                            <div className="text-5xl font-black text-white mt-3">
                                {totals.inventory.toLocaleString()}
                            </div>
                        </div>

                        {/* DONUT CHART */}
                        <div className="relative h-[520px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip content={<DonutTooltip />} />
                                    <Pie
                                        data={donutData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius="56%"   // smaller = thicker ring
                                        outerRadius="96%"
                                        paddingAngle={4}
                                        stroke="rgba(255,255,255,0.08)"
                                        strokeWidth={2}
                                    >
                                        <Cell fill={INVENTORY_COLOR} />
                                        <Cell fill={ABNORMAL_COLOR} />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* RIGHT METRIC */}
                        <div className="flex flex-col items-center xl:items-start text-center xl:text-left">
                            <div className="flex items-center gap-4">
                                <div
                                    className="h-4 w-4 rounded-full"
                                    style={{ backgroundColor: ABNORMAL_COLOR }}
                                />
                                <div className="text-sm font-bold text-zinc-400">
                                    Abnormal SKU
                                </div>
                            </div>
                            <div className="text-5xl font-black text-white mt-3">
                                {totals.abnormal.toLocaleString()}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}