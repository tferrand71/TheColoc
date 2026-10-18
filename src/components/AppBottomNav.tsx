"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActivePath, type NavBadges } from "./AppSidebar";

const MOBILE_HREFS = ["/", "/menage", "/liste", "/fil", "/annonces"];

export function AppBottomNav({ badges }: { badges: NavBadges }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((i) => MOBILE_HREFS.includes(i.href));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href, item.exact);
          const badge = item.badge?.(badges);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors
                ${active ? "text-[var(--color-text-main)]" : "text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]"}`}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-gradient-to-r from-[var(--color-mauve)] to-[var(--color-pink)]" />
              )}
              <span className="relative">
                <Icon className={`h-5 w-5 ${active ? "text-[var(--color-mauve-text)]" : ""}`} />
                {badge !== null && badge !== undefined && (
                  <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-[var(--color-pink)] ring-2 ring-[var(--color-midnight)]" />
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
