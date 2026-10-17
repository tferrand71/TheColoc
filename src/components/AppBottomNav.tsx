"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/",         icon: "🏠", label: "Accueil",  exact: true },
  { href: "/menage",   icon: "🧹", label: "Ménage" },
  { href: "/liste",    icon: "🛒", label: "Liste" },
  { href: "/fil",      icon: "💬", label: "Fil" },
  { href: "/annonces", icon: "📣", label: "Annonces" },
];

export function AppBottomNav() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden
        border-t border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-stretch">
        {ITEMS.map(({ href, icon, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors
                ${active
                  ? "text-[var(--color-mauve-text)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                }`}
            >
              {active && (
                <span className="absolute -mt-8 h-0.5 w-8 rounded-full bg-[var(--color-mauve)]" />
              )}
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-[10px]">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
