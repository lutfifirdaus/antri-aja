import Link from "next/link";

export default function EventNotFound() {
  return (
    <section className="block">
      <h1>Acara tidak ditemukan</h1>
      <p className="lead">Acara ini mungkin sudah dihapus, atau alamatnya salah.</p>
      <Link href="/admin" className="btn btn-quiet">
        Kembali ke daftar acara
      </Link>
    </section>
  );
}
