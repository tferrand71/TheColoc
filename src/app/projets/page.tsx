import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CreateProjectForm } from "./CreateProjectForm";

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  IDEA:        { label: "Idée",      className: "bg-[var(--color-mauve)]/10 text-[var(--color-mauve-text)] border-[var(--color-mauve)]/20" },
  IN_PROGRESS: { label: "En cours",  className: "bg-[var(--color-warn)]/10 text-[var(--color-warn)] border-[var(--color-warn)]/20" },
  DONE:        { label: "Terminé",   className: "bg-[var(--color-ok)]/10 text-[var(--color-ok)] border-[var(--color-ok)]/20" },
} as const;

export default async function ProjetsPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { householdId } = session.user;

  const projects = await prisma.project.findMany({
    where: { householdId },
    include: {
      author: { select: { displayName: true, color: true } },
      _count: { select: { listItems: true, comments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const active = projects.filter((p) => p.status !== "DONE");
  const done = projects.filter((p) => p.status === "DONE");

  return (
    <div className="min-h-screen bg-[var(--color-midnight)]">
      <header className="lg:hidden sticky top-0 z-10 border-b border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[var(--color-text-muted)]
              transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]"
          >
            ← Accueil
          </Link>
          <div className="h-4 w-px bg-[var(--color-hairline-strong)]" />
          <span className="eyebrow">Projets</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl animate-rise px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[var(--color-text-main)]">Projets à 4</h1>
            <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">
              Achats, travaux, organisation — décisions collectives.
            </p>
          </div>
        </div>

        {/* Formulaire nouveau projet */}
        <CreateProjectForm />

        {/* Projets actifs */}
        {active.length > 0 && (
          <section className="mt-8">
            <h2 className="eyebrow mb-3">En cours & idées</h2>
            <div className="flex flex-col gap-3">
              {active.map((p) => {
                const s = STATUS_CONFIG[p.status];
                return (
                  <Link
                    key={p.id}
                    href={`/projets/${p.id}`}
                    className="flex items-start gap-4 rounded-2xl border border-[var(--color-hairline)]
                      bg-[var(--color-raised)] p-5 transition-all
                      hover:border-[var(--color-hairline-strong)] hover:bg-[var(--color-glass)]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--color-text-main)]">{p.title}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${s.className}`}>
                          {s.label}
                        </span>
                      </div>
                      {p.description && (
                        <p className="mt-1 text-sm text-[var(--color-text-muted)] line-clamp-1">{p.description}</p>
                      )}
                      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                        {p._count.listItems} item{p._count.listItems !== 1 ? "s" : ""}
                        {" · "}
                        {p._count.comments} commentaire{p._count.comments !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-[var(--color-text-muted)]">→</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Projets terminés */}
        {done.length > 0 && (
          <section className="mt-8">
            <h2 className="eyebrow mb-3">Terminés</h2>
            <div className="flex flex-col gap-2">
              {done.map((p) => (
                <Link
                  key={p.id}
                  href={`/projets/${p.id}`}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-hairline)]
                    px-4 py-3 opacity-60 transition-all hover:opacity-80"
                >
                  <span className="text-sm text-[var(--color-ok)]">✓</span>
                  <span className="flex-1 text-sm text-[var(--color-text-main)]">{p.title}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {projects.length === 0 && (
          <div className="mt-8 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-raised)] px-5 py-10 text-center">
            <p className="text-3xl">📋</p>
            <p className="mt-3 font-medium text-[var(--color-text-main)]">Pas encore de projets</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Crée le premier avec le formulaire ci-dessus.</p>
          </div>
        )}
      </main>
    </div>
  );
}
