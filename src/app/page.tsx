import Link from "next/link";
import { auth } from "@/auth";
import { signOut } from "@/auth";
import { getChoreSchedule, getWeekStart } from "@/lib/chores";
import { formatWeekRange } from "@/lib/chores-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TAG_LABELS: Record<string, string> = {
  MENAGE: "Ménage", BRUIT: "Bruit", ARGENT: "Argent", GENERAL: "Général",
};

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;

  const [assignments, recentMessages, activeAnnouncements] = await Promise.all([
    getChoreSchedule(user.householdId),
    prisma.message.findMany({
      where: { householdId: user.householdId },
      include: { author: { select: { displayName: true, color: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    user.role !== "PROPRIETAIRE"
      ? prisma.announcement.findMany({
          where: { householdId: user.householdId, archivedAt: null },
          include: {
            responses: { where: { userId: user.id }, select: { readAt: true, answer: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
        })
      : Promise.resolve([]),
  ]);

  const currentWeekStart = getWeekStart();
  const thisWeek = assignments.find((a) => a.weekStart.getTime() === currentWeekStart.getTime());
  const myThisWeek = thisWeek?.user.id === user.id;

  const messages = [...recentMessages].reverse();

  return (
    <div className="min-h-screen bg-[var(--color-midnight)]">
      {/* Header — mobile uniquement */}
      <header className="lg:hidden sticky top-0 z-10 border-b border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <span className="font-serif text-base font-bold text-gradient">La Coloc</span>
          <div className="ml-auto flex items-center gap-3">
            {user.role === "ADMIN" && (
              <Link href="/admin"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]
                  transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]">
                Admin
              </Link>
            )}
            <Link href="/profil">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white
                transition-transform hover:scale-110"
                style={{ backgroundColor: user.color, boxShadow: `0 0 16px -4px ${user.color}60` }}>
                {user.displayName?.slice(0, 2).toUpperCase()}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl animate-rise px-4 py-8 lg:py-12 lg:px-8">
        {/* Salutation */}
        <div className="mb-8 lg:mb-10">
          <h1 className="font-serif text-3xl font-bold text-[var(--color-text-main)] lg:text-4xl">
            Bonjour, {user.displayName} !
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Annonces en cours */}
        {activeAnnouncements.length > 0 && (
          <section className="mb-6">
            <h2 className="eyebrow mb-3">Annonces du proprio</h2>
            <div className="flex flex-col gap-2">
              {activeAnnouncements.map((ann) => {
                const unread = !ann.responses[0]?.readAt;
                return (
                  <Link key={ann.id} href={`/annonces/${ann.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--color-gold)]/30
                      bg-[var(--color-gold)]/5 px-4 py-3 transition-all hover:bg-[var(--color-gold)]/10">
                    <span className="text-lg">📣</span>
                    <span className="flex-1 text-sm font-medium text-[var(--color-text-main)]">{ann.title}</span>
                    {unread && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-mauve)]" />}
                    <span className="text-[var(--color-text-muted)]">→</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Grille principale — 1 col mobile, 2 col desktop */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ménage */}
          <section>
            <h2 className="eyebrow mb-3">Ménage cette semaine</h2>
            <Link href="/menage"
              className={`flex items-center gap-4 rounded-2xl border p-5 transition-all
                ${myThisWeek && thisWeek?.status === "TODO"
                  ? "border-[var(--color-mauve)]/40 bg-[var(--color-mauve)]/8 hover:bg-[var(--color-mauve)]/12"
                  : "border-[var(--color-hairline)] bg-[var(--color-raised)] hover:border-[var(--color-hairline-strong)]"
                }`}>
              <span className="text-3xl">🧹</span>
              <div className="flex-1 min-w-0">
                {thisWeek ? (
                  <>
                    <p className="font-semibold text-[var(--color-text-main)]">
                      {thisWeek.user.id === user.id ? "C'est ton tour !" : `${thisWeek.user.displayName} s'en charge`}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                      {formatWeekRange(thisWeek.weekStart)}
                      {thisWeek.status === "DONE" && " · ✓ Validé"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)]">Aucune semaine planifiée</p>
                )}
              </div>
              <span className="text-[var(--color-text-muted)]">→</span>
            </Link>
          </section>

          {/* Fil — 3 derniers messages */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="eyebrow">Fil de discussion</h2>
              <Link href="/fil" className="text-xs text-[var(--color-mauve-text)] hover:underline">
                Voir tout →
              </Link>
            </div>
            {messages.length === 0 ? (
              <Link href="/fil"
                className="flex items-center justify-center rounded-2xl border border-dashed
                  border-[var(--color-hairline-strong)] py-6 text-sm text-[var(--color-text-muted)]
                  transition-colors hover:text-[var(--color-text-main)]">
                Pas encore de messages
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                {messages.map((msg) => (
                  <Link key={msg.id} href="/fil"
                    className="flex items-start gap-3 rounded-xl border border-[var(--color-hairline)]
                      bg-[var(--color-raised)] px-4 py-3 transition-all hover:border-[var(--color-hairline-strong)]">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: msg.author.color }}>
                      {msg.author.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-main)]">{msg.author.displayName}</span>
                        {msg.tag && (
                          <span className="text-[10px] text-[var(--color-text-muted)]">{TAG_LABELS[msg.tag]}</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-[var(--color-text-muted)]">{msg.body}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Raccourcis — cachés sur desktop (sidebar suffit) */}
          <section className="lg:hidden">
            <h2 className="eyebrow mb-3">Navigation</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { href: "/menage", icon: "🧹", label: "Ménage" },
                { href: "/liste", icon: "🛒", label: "Liste" },
                { href: "/projets", icon: "📋", label: "Projets" },
                { href: "/annonces", icon: "📣", label: "Annonces" },
              ].map(({ href, icon, label }) => (
                <Link key={href} href={href}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-hairline)]
                    bg-[var(--color-raised)] py-4 text-sm font-medium text-[var(--color-text-muted)]
                    transition-all hover:border-[var(--color-hairline-strong)] hover:text-[var(--color-text-main)]">
                  <span className="text-2xl">{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          </section>

          {/* Liens rapides — desktop uniquement */}
          <section className="hidden lg:block">
            <h2 className="eyebrow mb-3">Accès rapide</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/liste",    icon: "🛒", label: "Liste courses",  desc: "Courses communes" },
                { href: "/projets",  icon: "📋", label: "Projets à 4",   desc: "Décisions collectives" },
                { href: "/annonces", icon: "📣", label: "Annonces",       desc: "Messages du proprio" },
                { href: "/profil",   icon: "👤", label: "Mon profil",     desc: "Préférences & notifs" },
              ].map(({ href, icon, label, desc }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--color-hairline)]
                    bg-[var(--color-raised)] px-4 py-3.5 transition-all
                    hover:border-[var(--color-hairline-strong)] hover:bg-[var(--color-glass)]">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-main)]">{label}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Déconnexion — mobile uniquement */}
        <div className="mt-10 flex justify-center lg:hidden">
          <form action={async () => { "use server"; await signOut({ redirectTo: "/connexion" }); }}>
            <button type="submit"
              className="rounded-xl border border-[var(--color-hairline-strong)] bg-transparent px-4 py-2 text-sm
                text-[var(--color-text-muted)] transition-colors hover:border-red-500/30 hover:text-red-400">
              Se déconnecter
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
