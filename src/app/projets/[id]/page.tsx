import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProjectDetail, type ProjectItemRow, type CommentRow } from "./ProjectDetail";

export const dynamic = "force-dynamic";

const STATUS_LABEL = { IDEA: "Idée", IN_PROGRESS: "En cours", DONE: "Terminé" } as const;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjetPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      author: { select: { displayName: true, color: true } },
      listItems: {
        orderBy: { createdAt: "asc" },
      },
      comments: {
        include: { author: { select: { displayName: true, color: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project || project.householdId !== session.user.householdId) notFound();

  const items: ProjectItemRow[] = project.listItems.map((i) => ({
    id: i.id,
    name: i.name,
    boughtAt: i.boughtAt,
  }));

  const comments: CommentRow[] = project.comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    author: c.author,
  }));

  return (
    <div className="min-h-screen bg-[var(--color-midnight)]">
      <header className="lg:hidden sticky top-0 z-10 border-b border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link
            href="/projets"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[var(--color-text-muted)]
              transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]"
          >
            ← Projets
          </Link>
          <div className="h-4 w-px bg-[var(--color-hairline-strong)]" />
          <span className="eyebrow truncate">{project.title}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl animate-rise px-4 py-8">
        {/* En-tête projet */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-[var(--color-text-main)]">
            {project.title}
          </h1>
          {project.description && (
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{project.description}</p>
          )}
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Créé par {project.author.displayName} ·{" "}
            {project.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </p>
        </div>

        <ProjectDetail
          projectId={project.id}
          status={project.status as "IDEA" | "IN_PROGRESS" | "DONE"}
          items={items}
          comments={comments}
        />
      </main>
    </div>
  );
}
