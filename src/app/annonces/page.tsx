import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateAnnouncementForm } from "./CreateAnnouncementForm";

export const dynamic = "force-dynamic";

const TYPE_CONFIG = {
  REUNION:     { label: "Réunion",     icon: "📅" },
  VISITE:      { label: "Visite",      icon: "🚪" },
  TRAVAUX:     { label: "Travaux",     icon: "🔨" },
  INFORMATION: { label: "Information", icon: "ℹ️" },
  AUTRE:       { label: "Autre",       icon: "📌" },
} as const;

export default async function AnnoncesPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { householdId, id: userId, role } = session.user;
  const isProprietaire = role === "PROPRIETAIRE";

  const announcements = await prisma.announcement.findMany({
    where: { householdId },
    include: {
      author: { select: { displayName: true, color: true } },
      responses: {
        select: { userId: true, answer: true, readAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const active = announcements.filter((a) => !a.archivedAt);
  const archived = announcements.filter((a) => a.archivedAt);

  return (
    <div className="min-h-screen bg-[var(--color-midnight)]">
      <header className="lg:hidden sticky top-0 z-10 border-b border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[var(--color-text-muted)]
              transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]">
            ← Accueil
          </Link>
          <div className="h-4 w-px bg-[var(--color-hairline-strong)]" />
          <span className="eyebrow">Annonces</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl animate-rise px-4 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-[var(--color-text-main)]">Annonces</h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
            {isProprietaire ? "Tes messages aux colocs." : "Messages du propriétaire."}
          </p>
        </div>

        {isProprietaire && <CreateAnnouncementForm />}

        {active.length === 0 && !isProprietaire && (
          <div className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-raised)] px-5 py-10 text-center">
            <p className="text-3xl">📭</p>
            <p className="mt-3 font-medium text-[var(--color-text-main)]">Aucune annonce en cours</p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {active.map((ann) => {
            const cfg = TYPE_CONFIG[ann.type];
            const myResponse = ann.responses.find((r) => r.userId === userId);
            const readCount = ann.responses.filter((r) => r.readAt).length;
            const respondedCount = ann.responses.filter((r) => r.answer).length;

            return (
              <Link key={ann.id} href={`/annonces/${ann.id}`}
                className="flex items-start gap-4 rounded-2xl border border-[var(--color-hairline)]
                  bg-[var(--color-raised)] p-5 transition-all
                  hover:border-[var(--color-hairline-strong)] hover:bg-[var(--color-glass)]">
                <span className="text-2xl">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--color-text-main)]">{ann.title}</span>
                    <span className="rounded-full border border-[var(--color-hairline-strong)]
                      px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                      {cfg.label}
                    </span>
                    {!myResponse?.readAt && !isProprietaire && (
                      <span className="h-2 w-2 rounded-full bg-[var(--color-mauve)]" />
                    )}
                  </div>
                  {ann.eventAt && (
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      📅 {ann.eventAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                  )}
                  {isProprietaire && (
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {readCount} lu · {respondedCount} réponse{respondedCount !== 1 ? "s" : ""}
                    </p>
                  )}
                  {!isProprietaire && myResponse?.answer && (
                    <p className={`mt-1 text-xs font-medium ${myResponse.answer === "DISPONIBLE" ? "text-[var(--color-ok)]" : "text-red-400"}`}>
                      {myResponse.answer === "DISPONIBLE" ? "✓ Disponible" : "✗ Pas disponible"}
                    </p>
                  )}
                </div>
                <span className="text-[var(--color-text-muted)]">→</span>
              </Link>
            );
          })}
        </div>

        {archived.length > 0 && (
          <section className="mt-8">
            <h2 className="eyebrow mb-3">Archivées</h2>
            <div className="flex flex-col gap-2">
              {archived.map((ann) => (
                <Link key={ann.id} href={`/annonces/${ann.id}`}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-hairline)]
                    px-4 py-3 opacity-50 hover:opacity-70 transition-opacity">
                  <span className="text-sm">{TYPE_CONFIG[ann.type].icon}</span>
                  <span className="flex-1 text-sm text-[var(--color-text-muted)]">{ann.title}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
