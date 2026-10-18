import { redirect } from "next/navigation";
import Link from "next/link";
import { Archive, CalendarDays, ChevronRight, Inbox, Megaphone } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { CreateAnnouncementForm } from "./CreateAnnouncementForm";
import { ANNOUNCEMENT_TYPES } from "./types";

export const dynamic = "force-dynamic";

export default async function AnnoncesPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { householdId, id: userId, role } = session.user;
  const isProprietaire = role === "PROPRIETAIRE";

  const announcements = await prisma.announcement.findMany({
    where: { householdId },
    include: {
      author: { select: { displayName: true, color: true } },
      responses: { select: { userId: true, answer: true, readAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const active = announcements.filter((a) => !a.archivedAt);
  const archived = announcements.filter((a) => a.archivedAt);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={Megaphone}
        title="Annonces"
        description={isProprietaire ? "Tes messages aux colocataires." : "Les messages du propriétaire."}
        actions={isProprietaire ? <CreateAnnouncementForm /> : undefined}
      />

      {active.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="Aucune annonce en cours"
          description={isProprietaire ? "Publie une annonce pour prévenir les colocs d'une visite, de travaux…" : "Tu seras prévenu dès que le propriétaire publie quelque chose."}
        />
      )}

      {active.length > 0 && (
        <section>
          <SectionTitle title="En cours" count={active.length} />
          <div className="flex flex-col gap-3">
            {active.map((ann) => {
              const type = ANNOUNCEMENT_TYPES[ann.type];
              const Icon = type.icon;
              const myResponse = ann.responses.find((r) => r.userId === userId);
              const unread = !isProprietaire && !myResponse?.readAt;
              const readCount = ann.responses.filter((r) => r.readAt).length;
              const respondedCount = ann.responses.filter((r) => r.answer).length;

              return (
                <Link key={ann.id} href={`/annonces/${ann.id}`} className="card-interactive group flex items-start gap-4 p-5">
                  <div className="icon-tile">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[var(--color-text-main)]">{ann.title}</span>
                      <span className="badge-neutral">{type.label}</span>
                      {unread && <span className="badge-pink">Nouveau</span>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-muted)]">{ann.body}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
                      {ann.eventAt && (
                        <span className="flex items-center gap-1.5 capitalize">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {ann.eventAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                        </span>
                      )}
                      {isProprietaire && (
                        <span>{readCount} lu{readCount > 1 ? "s" : ""} · {respondedCount} réponse{respondedCount > 1 ? "s" : ""}</span>
                      )}
                      {!isProprietaire && myResponse?.answer && (
                        <span className={myResponse.answer === "DISPONIBLE" ? "text-[var(--color-ok)]" : "text-[var(--color-down)]"}>
                          {myResponse.answer === "DISPONIBLE" ? "Tu es disponible" : "Tu n'es pas disponible"}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 text-[var(--color-text-faint)] transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <section className="mt-10">
          <SectionTitle title="Archivées" count={archived.length} />
          <div className="card divide-y divide-[var(--color-hairline)]">
            {archived.map((ann) => (
              <Link
                key={ann.id}
                href={`/annonces/${ann.id}`}
                className="flex items-center gap-3 px-5 py-3 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)]/50 hover:text-[var(--color-text-main)]"
              >
                <Archive className="h-4 w-4 text-[var(--color-text-faint)]" />
                <span className="flex-1">{ann.title}</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
