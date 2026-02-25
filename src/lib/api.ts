const API_BASE =
    (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

const withBase = (path: string) =>
    path.startsWith("http")
        ? path
        : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const token = localStorage.getItem("access_token");

    const res = await fetch(withBase(path), {
        ...init,
        headers: {
            ...(init?.headers ?? {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
    }

    return (await res.json()) as T;
}

export async function apiPostJson<T>(path: string, body: any): Promise<T> {
    return apiFetch<T>(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

export async function apiPostMultipart<T>(path: string, form: FormData): Promise<T> {
    return apiFetch<T>(path, {
        method: "POST",
        body: form,
    });
}