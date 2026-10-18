import Link from "next/link";
import { ChevronLeft, type LucideIcon } from "lucide-react";

const AVATAR_SIZES = {
  xs: "h-5 w-5 rounded-md text-[9px]",
  sm: "h-7 w-7 rounded-lg text-[11px]",
  md: "h-9 w-9 rounded-xl text-xs",
  lg: "h-12 w-12 rounded-2xl text-sm",
  xl: "h-16 w-16 rounded-2xl text-lg",
} as const;

export function Avatar({
  name,
  color,
  size = "md",
  className = "",
}: {
  name: string;
  color: string;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center font-semibold text-white ring-1 ring-inset ring-white/15 ${AVATAR_SIZES[size]} ${className}`}
      style={{ background: `linear-gradient(140deg, ${color}, ${color}bb)` }}
      aria-hidden
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link
          href={back.href}
          className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-main)]"
        >
          <ChevronLeft className="h-4 w-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <div className="icon-tile hidden sm:flex">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-main)] sm:text-[28px]">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function SectionTitle({
  title,
  action,
  count,
}: {
  title: string;
  action?: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-main)]">
        {title}
        {count !== undefined && (
          <span className="rounded-md bg-[var(--color-surface)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
            {count}
          </span>
        )}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-text-muted)] ring-1 ring-inset ring-[var(--color-hairline-strong)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-medium text-[var(--color-text-main)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-mauve)] to-[var(--color-pink)] shadow-[0_6px_20px_-8px_rgba(139,92,246,0.9)]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20h14V9.5" />
          <path d="M10 20v-5h4v5" />
        </svg>
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-[var(--color-text-main)]">
          La Coloc
        </span>
      )}
    </span>
  );
}
