export type ApiResult<T = unknown> = { ok: boolean; status: number; data: T | null };

/** status 0 means the request never reached the server. */
export async function sendJson<T = unknown>(method: string, url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export function errorMessage(status: number, conflict?: string): string {
  if (status === 0) return "Tidak tersambung ke server. Periksa sinyal, lalu coba lagi.";
  if (status === 400) return "Isian belum benar. Periksa kolom yang ditandai, lalu coba lagi.";
  if (status === 401 || status === 403) return "Sesi berakhir atau akun tidak punya akses. Muat ulang halaman dan masuk lagi.";
  if (status === 404) return "Data tidak ditemukan. Muat ulang halaman.";
  if (status === 409) return conflict ?? "Data ini sudah ada.";
  return "Terjadi kesalahan di server. Coba lagi sebentar lagi.";
}
