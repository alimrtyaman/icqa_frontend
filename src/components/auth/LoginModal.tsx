import { useState } from "react";
import { useAuth } from "./AuthProvider";
export function LoginModal() {
    const { loginOpen, closeLogin, login } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    if (!loginOpen) return null;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        try {
            const ok = await login(username.trim(), password);
            if (!ok) setErr("Invalid credentials.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/60 backdrop-blur-sm">
            <div className="w-[420px] max-w-[92vw] rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Login</h3>
                    <button onClick={closeLogin} className="text-white/70 hover:text-white" type="button">
                        ✕
                    </button>
                </div>

                <form onSubmit={onSubmit} className="mt-4 space-y-3">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Username</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
                            placeholder="Enter username"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/20"
                            placeholder="Enter password"
                        />
                    </div>

                    {err && <div className="text-sm text-red-300">{err}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl border border-white/10 bg-blue-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>

                    <p className="text-xs text-slate-400">
                        (Şimdilik demo login. Backend JWT gelince gerçek auth bağlarız.)
                    </p>
                </form>
            </div>
        </div>
    );
}