import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, CircleCheck, FolderKanban, ListChecks, MessageSquare } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { CreateProjectForm } from "./CreateProjectForm";

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  IDEA:        { label: "Idée",     className: "badge-mauve" },
  IN_PROGRESS: { label: "En cours", className: "badge-pink" },
  DONE:        { label: "Terminé",  className: "badge-ok" },
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
    <>
      <PageHeader
        icon={FolderKanban}
        title="Projets"
        description="Achats, travaux, organisation : les décisions qu'on prend ensemble."
        actions={<CreateProjectForm />}
      />

      {projects.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="Pas encore de projet"
          description="Un canapé à acheter, une soirée à organiser ? Crée un projet pour en discuter."
        />
      )}

      {active.length > 0 && (
        <section>
          <SectionTitle title="En cours et idées" count={active.length} />
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((p) => {
              const s = STATUS_CONFIG[p.status];
              return (
                <Link key={p.id} href={`/projets/${p.id}`} className="card-interactive group flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium leading-snug text-[var(--color-text-main)]">{p.title}</p>
                    <span className={s.className}>{s.label}</span>
                  </div>
                  {p.description && (
                    <p className="line-clamp-2 text-sm text-[var(--color-text-muted)]">{p.description}</p>
                  )}
                  <div className="mt-auto flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <Avatar name={p.author.displayName} color={p.author.color} size="xs" />
                      {p.author.displayName}
                    </span>
                    <span className="flex items-center gap-1"><ListChecks className="h-3.5 w-3.5" />{p._count.listItems}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{p._count.comments}</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section className="mt-10">
          <SectionTitle title="Terminés" count={done.length} />
          <div className="card divide-y divide-[var(--color-hairline)]">
            {done.map((p) => (
              <Link
                key={p.id}
                href={`/projets/${p.id}`}
                className="flex items-center gap-3 px-5 py-3 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)]/50 hover:text-[var(--color-text-main)]"
              >
                <CircleCheck className="h-4 w-4 text-[var(--color-ok)]" />
                <span className="flex-1">{p.title}</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
