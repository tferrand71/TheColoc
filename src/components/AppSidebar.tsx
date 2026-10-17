"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type User = {
  displayName: string;
  color: string;
  role: string;
  username: string | null;
};

const NAV = [
  { href: "/",         icon: "🏠", label: "Accueil",   exact: true },
  { href: "/menage",   icon: "🧹", label: "Ménage" },
  { href: "/liste",    icon: "🛒", label: "Liste" },
  { href: "/projets",  icon: "📋", label: "Projets" },
  { href: "/fil",      icon: "💬", label: "Fil" },
  { href: "/annonces", icon: "📣", label: "Annonces" },
];

export function AppSidebar({ user }: { user: User }) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex h-full flex-col bg-[#09070f] px-3 py-5">
      {/* Logo */}
      <div className="mb-8 px-3">
        <span className="font-serif text-xl font-bold text-gradient">La Coloc</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map(({ href, icon, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                ${active
                  ? "bg-[var(--color-mauve)]/12 text-[var(--color-mauve-text)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]"
                }`}
            >
              {active && (
                <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-[var(--color-mauve)]" />
              )}
              <span className="text-base leading-none">{icon}</span>
              <span className="flex-1">{label}</span>
              {active && (
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-mauve)]" />
              )}
            </Link>
          );
        })}

        {user.role === "ADMIN" && (
          <>
            <div className="mx-3 my-2 h-px bg-[var(--color-hairline)]" />
            <Link
              href="/admin"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                ${isActive("/admin")
                  ? "bg-[var(--color-mauve)]/12 text-[var(--color-mauve-text)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]"
                }`}
            >
              <span className="text-base leading-none">⚙️</span>
              Admin
            </Link>
          </>
        )}
      </nav>

      {/* User card */}
      <div className="mt-6">
        <div className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-raised)] p-3">
          <Link
            href="/profil"
            className="mb-3 flex items-center gap-3 rounded-xl px-1 py-1 transition-colors
              hover:bg-[var(--color-hairline)]"
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
              style={{
                backgroundColor: user.color,
                boxShadow: `0 0 16px -4px ${user.color}70`,
              }}
            >
              {user.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-text-main)]">
                {user.displayName}
              </p>
              {user.username && (
                <p className="truncate font-mono text-xs text-[var(--color-text-muted)]">
                  @{user.username}
                </p>
              )}
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/connexion" })}
            className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-[var(--color-text-muted)]
              transition-colors hover:bg-[var(--color-hairline-strong)] hover:text-red-400"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
