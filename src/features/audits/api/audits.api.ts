export const API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export async function postMultipart<T>(
    path: string,
    form: FormData,
    token?: string | null
): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        body: form,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
    }

    return (await res.json()) as T;
}