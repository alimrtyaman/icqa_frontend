// src/components/auth/ProtectedRoute.tsx
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthed, openLogin } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (!isAuthed) {
            const fullPath = location.pathname + location.search; // ✅ IMPORTANT
            openLogin(fullPath);
        }
    }, [isAuthed, openLogin, location.pathname, location.search]);

    if (!isAuthed) return null;
    return <>{children}</>;
}