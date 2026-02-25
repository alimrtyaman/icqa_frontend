// src/components/auth/AuthProvider.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { apiPostJson } from "../../lib/api";

type AuthContextValue = {
    token: string | null;
    isAuthed: boolean;
    loginOpen: boolean;
    openLogin: (redirectTo?: string) => void;
    closeLogin: () => void;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [loginOpen, setLoginOpen] = useState(false);
    const [token, setToken] = useState<string | null>(
        localStorage.getItem("access_token")
    );

    const isAuthed = !!token;

    function openLogin(redirectTo?: string) {
        if (redirectTo) localStorage.setItem("post_login_redirect", redirectTo);
        setLoginOpen(true);
    }

    function closeLogin() {
        setLoginOpen(false);
    }

    async function login(username: string, password: string) {
        try {
            const res = await apiPostJson<any>("/api/auth/login", {
                username,
                password,
            });

            const access =
                res.accessToken ?? res.access_token ?? res.token ?? res.jwt ?? null;

            if (!access) return false;

            localStorage.setItem("access_token", access);
            setToken(access);
            setLoginOpen(false);
            return true;
        } catch {
            return false;
        }
    }

    function logout() {
        localStorage.removeItem("access_token");
        setToken(null);
    }

    const value = useMemo<AuthContextValue>(
        () => ({ token, isAuthed, loginOpen, openLogin, closeLogin, login, logout }),
        [token, isAuthed, loginOpen]
    );

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}