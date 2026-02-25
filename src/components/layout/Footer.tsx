// Footer.tsx
export function Footer() {
    const milestones = [
        "Updating data on server",
        "Automation data analysis",
        "Pick Analysis",
        "Putaway Analysis",
        "Analysis implementation of Shein warehouses based in Poland",
    ];

    return (
        <footer className="relative border-t border-white/10 bg-[#080a0d] py-16 overflow-hidden">
            {/* Arka Plan: Şantiye Blueprint Izgarası */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[size:40px_40px] bg-[linear-gradient(to_right,#f59e0b_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b_1px,transparent_1px)]" />

            <div className="mx-auto max-w-7xl px-6 relative z-10">
                <div className="flex flex-col gap-16 lg:flex-row lg:items-start lg:justify-between">

                    {/* SOL TARAF: ICQA POLAND MERKEZİ */}
                    <div className="flex flex-1 flex-col gap-8">
                        <div className="relative group">
                            {/* Ana Başlık: ICQA POLAND */}
                            <h2 className="text-6xl font-black tracking-tighter text-white/90">
                                ICQA <span className="text-amber-500">POLAND</span>
                            </h2>

                            {/* Görseldeki Stil: Kalın Turuncu Alt Çizgi */}
                            <div className="mt-3 h-2 w-56 bg-amber-500 relative overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                                <div className="absolute inset-0 bg-white/30 -translate-x-full animate-[shimmer_2.5s_infinite]" />
                            </div>

                            <div className="mt-6 flex flex-col gap-1 font-mono text-[10px] tracking-[0.3em] text-slate-500 uppercase">
                                <span>Operation Node: SHEIN_WROCLAW</span>
                                <span className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Data Pipeline: Stable
                                </span>
                            </div>
                        </div>

                        {/* Shein Lojistik Akış Simülasyonu */}
                        <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-black/40 p-4 w-fit backdrop-blur-sm">
                            <div className="flex gap-1 items-end h-8">
                                {[...Array(8)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-amber-500/40 rounded-full"
                                        style={{
                                            height: `${30 + Math.random() * 70}%`,
                                            animation: 'flow-pulse 1s ease-in-out infinite alternate',
                                            animationDelay: `${i * 0.1}s`
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 font-mono leading-none uppercase">
                                Shein Analysis<br />
                                <span className="text-amber-500/70 text-[8px]">Poland_Sector</span>
                            </div>
                        </div>
                    </div>

                    {/* SAĞ TARAF: Milestones ve Erişim */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 lg:w-[55%]">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] border-l-2 border-amber-500 pl-3">
                                Milestones
                            </h4>
                            <ul className="space-y-4">
                                {milestones.map((m) => (
                                    <li key={m} className="group flex items-start gap-3">
                                        <div className="mt-1.5 h-[1px] w-3 bg-slate-800 group-hover:w-6 group-hover:bg-amber-500 transition-all duration-300" />
                                        <span className="text-xs text-slate-500 group-hover:text-slate-100 transition-colors font-medium leading-relaxed">{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] border-l-2 border-amber-500 pl-3">
                                Node Access
                            </h4>
                            <div className="space-y-4 font-mono">
                                <div className="group cursor-pointer">
                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Technical Support</p>
                                    <p className="text-xs text-slate-400 group-hover:text-amber-500 transition-colors">support@icqa-poland.pl</p>
                                </div>
                                <div className="group cursor-pointer">
                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Communication</p>
                                    <p className="text-xs text-slate-400 group-hover:text-emerald-500 transition-colors">Slack: #icqa-pl-ops</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alt Bilgi Barı - Sadeleştirilmiş Versiyon */}
                <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 text-[10px] font-mono text-slate-600 tracking-widest uppercase">
                        <span>Status: <span className="text-emerald-600">Secure</span></span>
                        <span className="opacity-30">|</span>
                        <span>Enc: AES-256</span>
                    </div>

                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                        © {new Date().getFullYear()} ICQA Poland Analytics
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                @keyframes flow-pulse {
                    0% { transform: scaleY(0.8); opacity: 0.4; }
                    100% { transform: scaleY(1.2); opacity: 1; }
                }
            `}</style>
        </footer>
    );
}