import { Outlet } from "react-router-dom";
import { AuthProvider } from "../components/auth/AuthProvider";
import { LoginModal } from "../components/auth/LoginModal";

export function Root() {
    return (
        <AuthProvider>
            <Outlet />
            <LoginModal />
        </AuthProvider>
    );
}