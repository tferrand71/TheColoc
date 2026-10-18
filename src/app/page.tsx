import Link from "next/link";
import {
  ArrowRight,
  Brush,
  CircleCheck,
  FolderKanban,
  Megaphone,
  MessagesSquare,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/auth";
import { getChoreSchedule, getWeekStart } from "@/lib/chores";
import { formatWeekRange } from "@/lib/chores-utils";
import { prisma } from "@/lib/prisma";
import { Avatar, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const TAG_LABELS: Record<string, string> = {
  MENAGE: "Ménage", BRUIT: "Bruit", ARGENT: "Argent", GENERAL: "Général",
};

function greeting() {
  const h = Number(new Date().toLocaleString("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }));
  return h >= 18 || h < 5 ? "Bonsoir" : "Bonjour";
}

function timeAgo(date: Date) {
  const diff = Math.round((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return "à l'instant";
  if (diff < 60) return `il y a ${diff} min`;
  if (diff < 60 * 24) return `il y a ${Math.round(diff / 60)} h`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
}

function StatCard({
  href,
  icon: Icon,
  label,
  value,
  hint,
  highlight,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href} className="card-interactive group flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
        <Icon className={`h-4 w-4 ${highlight ? "text-[var(--color-pink-text)]" : "text-[var(--color-text-faint)]"}`} />
      </div>
      <div>
        <p className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">{value}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
          {hint}
          <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </p>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;
  if (!user) return null;

  const isProprietaire = user.role === "PROPRIETAIRE";

  const [assignments, recentMessages, activeAnnouncements, listCount, activeProjects] = await Promise.all([
    getChoreSchedule(user.householdId),
    prisma.message.findMany({
      where: { householdId: user.householdId },
      include: { author: { select: { displayName: true, color: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.announcement.findMany({
      where: { householdId: user.householdId, archivedAt: null },
      include: {
        responses: { where: { userId: user.id }, select: { readAt: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.listItem.count({
      where: { householdId: user.householdId, category: "CONSOMMABLE", boughtAt: null },
    }),
    prisma.project.count({
      where: { householdId: user.householdId, status: { not: "DONE" } },
    }),
  ]);

  const currentWeekStart = getWeekStart();
  const thisWeek = assignments.find((a) => a.weekStart.getTime() === currentWeekStart.getTime());
  const upcoming = assignments.filter((a) => a.weekStart.getTime() > currentWeekStart.getTime()).slice(0, 3);
  const myTurn = thisWeek?.user.id === user.id;
  const choreDone = thisWeek?.status === "DONE";
  const unread = isProprietaire ? [] : activeAnnouncements.filter((a) => !a.responses[0]?.readAt);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris",
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm capitalize text-[var(--color-text-muted)]">{today}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--color-text-main)] sm:text-4xl">
          {greeting()}, <span className="text-gradient">{user.displayName}</span>
        </h1>
      </div>

      {unread.length > 0 && (
        <div className="flex flex-col gap-2">
          {unread.map((ann) => (
            <Link
              key={ann.id}
              href={`/annonces/${ann.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-[var(--color-pink)]/25 bg-[var(--color-pink)]/[0.06] px-4 py-3 transition-colors hover:bg-[var(--color-pink)]/10"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-pink)]/15 text-[var(--color-pink-text)]">
                <Megaphone className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--color-pink-text)]">Nouvelle annonce</p>
                <p className="truncate text-sm font-medium text-[var(--color-text-main)]">{ann.title}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}

      {/* Ménage de la semaine */}
      <Link
        href="/menage"
        className={`group relative overflow-hidden rounded-3xl border p-6 transition-colors sm:p-7
          ${myTurn && !choreDone
            ? "border-[var(--color-mauve)]/40 bg-gradient-to-br from-[var(--color-mauve)]/20 via-[var(--color-raised)] to-[var(--color-pink)]/10"
            : "border-[var(--color-hairline)] bg-[var(--color-raised)] hover:border-[var(--color-hairline-strong)]"}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="icon-tile h-12 w-12 rounded-2xl">
              <Brush className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow">Ménage · {thisWeek ? formatWeekRange(thisWeek.weekStart) : "cette semaine"}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--color-text-main)]">
                {!thisWeek
                  ? "Aucune semaine planifiée"
                  : myTurn
                    ? choreDone ? "Ton ménage est fait, merci !" : "C'est ton tour cette semaine"
                    : `${thisWeek.user.displayName} s'en charge`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {thisWeek && (choreDone
              ? <span className="badge-ok"><CircleCheck className="h-3 w-3" /> Fait</span>
              : <span className="badge-pink">À faire</span>)}
            {thisWeek && !myTurn && (
              <Avatar name={thisWeek.user.displayName} color={thisWeek.user.color} size="md" />
            )}
            <span className="btn btn-secondary btn-sm">
              {myTurn && !choreDone ? "Valider" : "Planning"}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </Link>

      {/* Chiffres clés */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          href="/liste"
          icon={ShoppingBasket}
          label="Courses"
          value={listCount}
          hint={listCount === 0 ? "Tout est en stock" : `article${listCount > 1 ? "s" : ""} à acheter`}
          highlight={listCount > 0}
        />
        <StatCard
          href="/projets"
          icon={FolderKanban}
          label="Projets"
          value={activeProjects}
          hint="en cours ou en idée"
        />
        <StatCard
          href="/annonces"
          icon={Megaphone}
          label="Annonces"
          value={isProprietaire ? activeAnnouncements.length : unread.length}
          hint={isProprietaire ? "publiées en cours" : unread.length > 0 ? "non lues" : "Rien de nouveau"}
          highlight={unread.length > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Discussion */}
        <section className="lg:col-span-3">
          <SectionTitle
            title="Dernières discussions"
            action={
              <Link href="/fil" className="text-xs font-medium text-[var(--color-mauve-text)] hover:underline">
                Ouvrir le fil
              </Link>
            }
          />
          <div className="card divide-y divide-[var(--color-hairline)]">
            {recentMessages.length === 0 ? (
              <Link href="/fil" className="flex items-center gap-3 px-5 py-8 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]">
                <MessagesSquare className="h-4 w-4" />
                Pas encore de messages, lance la conversation.
              </Link>
            ) : (
              recentMessages.map((msg) => (
                <Link key={msg.id} href="/fil" className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-[var(--color-surface)]/50">
                  <Avatar name={msg.author.displayName} color={msg.author.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--color-text-main)]">{msg.author.displayName}</span>
                      {msg.tag && <span className="badge-neutral">{TAG_LABELS[msg.tag]}</span>}
                      <span className="ml-auto text-[11px] text-[var(--color-text-faint)]">{timeAgo(msg.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-[var(--color-text-muted)]">{msg.body}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Prochaines semaines */}
        <section className="lg:col-span-2">
          <SectionTitle
            title="Prochaines semaines"
            action={
              <Link href="/menage" className="text-xs font-medium text-[var(--color-mauve-text)] hover:underline">
                Tout voir
              </Link>
            }
          />
          <div className="card divide-y divide-[var(--color-hairline)]">
            {upcoming.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[var(--color-text-muted)]">Planning à venir.</p>
            ) : (
              upcoming.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Avatar name={a.user.displayName} color={a.user.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-main)]">
                      {a.user.id === user.id ? "Toi" : a.user.displayName}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{formatWeekRange(a.weekStart)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
