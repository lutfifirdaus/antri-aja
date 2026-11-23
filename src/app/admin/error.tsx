"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="block">
      <h1>Halaman tidak bisa dimuat</h1>
      <p className="notice error" role="alert">
        Terjadi kesalahan saat memuat data. Data Anda tidak berubah. Coba muat ulang.
      </p>
      <button type="button" className="btn" onClick={reset}>
        Muat ulang
      </button>
    </section>
  );
}
