"use client";

import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/** Enlace «volver atrás» con flecha visible y área táctil clara. */
export function BackLink({ href, children, className = "" }: Props) {
  return (
    <Link
      href={href}
      className={`group inline-flex max-w-full items-center gap-2 rounded-xl py-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${className}`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-lg leading-none text-[var(--text-secondary)] transition-colors group-hover:border-purple-500/40 group-hover:text-[var(--text-primary)]"
        aria-hidden
      >
        ←
      </span>
      <span className="min-w-0 truncate font-medium">{children}</span>
    </Link>
  );
}
