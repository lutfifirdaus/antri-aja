import Link from "next/link";

// The mark is a ticket number, which is what the product hands out (docs/ui.md).
export function Brand({ href = "/admin" }: { href?: string }) {
  return (
    <Link href={href} className="brand">
      <span className="brand-mark" aria-hidden="true">
        A12
      </span>
      <span className="wordmark">
        Antri<span>Aja</span>
      </span>
    </Link>
  );
}
