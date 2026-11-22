import { signInWithGoogle, signOutAdmin } from "@/app/admin/actions";

export function SignInView({ failed }: { failed: "denied" | "other" | null }) {
  return (
    <section className="signin" aria-labelledby="signin-title">
      <h1 id="signin-title">Masuk sebagai admin</h1>
      {failed === "denied" && (
        <p className="notice error" role="alert">
          Akun ini tidak punya akses. Masuk dengan akun Google lain yang terdaftar sebagai admin.
        </p>
      )}
      {failed === "other" && (
        <p className="notice error" role="alert">
          Masuk gagal. Coba lagi.
        </p>
      )}
      <form action={signInWithGoogle}>
        <button type="submit" className="btn">
          {failed === "denied" ? "Masuk dengan akun lain" : "Masuk dengan Google"}
        </button>
      </form>
    </section>
  );
}

export function DeniedView({ email }: { email: string }) {
  return (
    <section className="signin" aria-labelledby="denied-title">
      <h1 id="denied-title">Akun ini tidak punya akses</h1>
      <p className="lead">
        {email ? `${email} tidak ada dalam daftar admin.` : "Akun ini tidak ada dalam daftar admin."} Keluar, lalu masuk
        dengan akun lain.
      </p>
      <form action={signOutAdmin}>
        <button type="submit" className="btn btn-quiet">
          Keluar
        </button>
      </form>
    </section>
  );
}
