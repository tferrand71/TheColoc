"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Brush,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessagesSquare,
  ShieldCheck,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import { Avatar, Logo } from "./ui";

export type NavBadges = { menage: boolean; liste: number; annonces: number };

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: (b: NavBadges) => string | number | null;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Accueil", icon: LayoutDashboard, exact: true },
  { href: "/menage", label: "Ménage", icon: Brush, badge: (b) => (b.menage ? "À faire" : null) },
  { href: "/liste", label: "Courses", icon: ShoppingBasket, badge: (b) => b.liste || null },
  { href: "/projets", label: "Projets", icon: FolderKanban },
  { href: "/fil", label: "Discussion", icon: MessagesSquare },
  { href: "/annonces", label: "Annonces", icon: Megaphone, badge: (b) => b.annonces || null },
];

export function isActivePath(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  item,
  active,
  badge,
}: {
  item: Pick<NavItem, "href" | "label" | "icon">;
  active: boolean;
  badge?: string | number | null;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors
        ${active
          ? "bg-[var(--color-surface)] text-[var(--color-text-main)] ring-1 ring-inset ring-[var(--color-hairline-strong)]"
          : "text-[var(--color-text-muted)] hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]"
        }`}
    >
      <Icon
        className={`h-[18px] w-[18px] transition-colors ${active ? "text-[var(--color-mauve-text)]" : "text-[var(--color-text-faint)] group-hover:text-[var(--color-text-muted)]"}`}
      />
      <span className="flex-1">{item.label}</span>
      {badge !== null && badge !== undefined && (
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold
            ${typeof badge === "string"
              ? "bg-[var(--color-pink)]/15 text-[var(--color-pink-text)]"
              : "bg-[var(--color-mauve)]/15 text-[var(--color-mauve-text)]"}`}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function AppSidebar({
  user,
  badges,
}: {
  user: { displayName: string; color: string; role: string; username: string | null };
  badges: NavBadges;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[var(--color-ink)]/60 px-3 py-5">
      <Link href="/" className="mb-8 px-2">
        <Logo />
      </Link>

      <p className="eyebrow mb-2 px-3">Espace commun</p>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActivePath(pathname, item.href, item.exact)}
            badge={item.badge?.(badges)}
          />
        ))}
      </nav>

      {user.role === "ADMIN" && (
        <>
          <p className="eyebrow mb-2 mt-8 px-3">Gestion</p>
          <nav className="flex flex-col gap-0.5">
            <NavLink
              item={{ href: "/admin", label: "Comptes", icon: ShieldCheck }}
              active={isActivePath(pathname, "/admin")}
            />
          </nav>
        </>
      )}

      <div className="mt-auto pt-6">
        <div className="card flex items-center gap-3 p-2.5">
          <Link
            href="/profil"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-0.5 transition-opacity hover:opacity-80"
          >
            <Avatar name={user.displayName} color={user.color} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-text-main)]">{user.displayName}</p>
              <p className="truncate font-mono text-[11px] text-[var(--color-text-muted)]">
                {user.username ? `@${user.username}` : "Mon profil"}
              </p>
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/connexion" })}
            className="rounded-lg p-2 text-[var(--color-text-faint)] transition-colors hover:bg-[var(--color-down)]/10 hover:text-[var(--color-down)]"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
