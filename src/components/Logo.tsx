import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="logo" aria-label="FESTIVO">
      <span className="logo-mark" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      {!compact && <span className="logo-text">FESTIVO</span>}
    </Link>
  );
}
