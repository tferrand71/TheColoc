import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/chores-utils";
import { AppSidebar, type NavBadges } from "./AppSidebar";
import { AppBottomNav } from "./AppBottomNav";
import { Avatar, Logo } from "./ui";

async function getNavBadges(userId: string, householdId: string, isProprietaire: boolean): Promise<NavBadges> {
  const [choreTodo, listCount, unreadAnnouncements] = await Promise.all([
    prisma.choreAssignment.count({
      where: { userId, weekStart: getWeekStart(), status: "TODO" },
    }),
    prisma.listItem.count({
      where: { householdId, category: "CONSOMMABLE", boughtAt: null },
    }),
    isProprietaire
      ? Promise.resolve(0)
      : prisma.announcement.count({
          where: {
            householdId,
            archivedAt: null,
            NOT: { responses: { some: { userId, readAt: { not: null } } } },
          },
        }),
  ]);
  return { menage: choreTodo > 0, liste: listCount, annonces: unreadAnnouncements };
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    return <>{children}</>;
  }

  const { id, householdId, displayName, color, role, username } = session.user;
  const badges = await getNavBadges(id, householdId, role === "PROPRIETAIRE");

  return (
    <div className="lg:flex lg:h-screen lg:overflow-hidden">
      <aside className="hidden border-r border-[var(--color-hairline)] lg:flex lg:w-[260px] lg:flex-shrink-0 lg:flex-col lg:overflow-y-auto">
        <AppSidebar user={{ displayName, color, role, username }} badges={badges} />
      </aside>

      <div className="min-h-screen lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <header className="sticky top-0 z-30 border-b border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/" aria-label="Accueil">
              <Logo />
            </Link>
            <Link href="/profil" aria-label="Mon profil">
              <Avatar name={displayName} color={color} size="sm" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl animate-rise px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          {children}
        </main>
      </div>

      <AppBottomNav badges={badges} />
    </div>
  );
}
