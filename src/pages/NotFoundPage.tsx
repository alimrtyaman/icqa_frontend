import { Link } from "react-router-dom";

export function NotFoundPage() {
    return (
        <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900 }}>404</h1>
            <p style={{ marginTop: 8, color: "#6b7280" }}>Sayfa bulunamadı.</p>
            <Link to="/" style={{ display: "inline-block", marginTop: 12 }}>
                Home’a dön
            </Link>
        </div>
    );
}