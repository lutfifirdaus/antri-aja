import { auth } from "@/auth";
import { Brand } from "@/components/brand";
import { signOutAdmin } from "@/app/admin/actions";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  const email = session?.user?.email;

  return (
    <>
      <header className="site-header">
        <Brand />
        {email && (
          <div className="who">
            <span className="who-email">{email}</span>
            <form action={signOutAdmin}>
              <button type="submit" className="btn btn-quiet">
                Keluar
              </button>
            </form>
          </div>
        )}
      </header>
      <main className="page">{children}</main>
    </>
  );
}
