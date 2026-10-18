import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, PageHeader } from "@/components/ui";
import { ProjectDetail, type ProjectItemRow, type CommentRow } from "./ProjectDetail";

export const dynamic = "force-dynamic";

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
      listItems: { orderBy: { createdAt: "asc" } },
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
    <>
      <PageHeader
        back={{ href: "/projets", label: "Projets" }}
        title={project.title}
        description={
          <span className="flex items-center gap-2">
            <Avatar name={project.author.displayName} color={project.author.color} size="xs" />
            Créé par {project.author.displayName} le{" "}
            {project.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
          </span>
        }
      />

      {project.description && (
        <p className="-mt-4 mb-8 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
          {project.description}
        </p>
      )}

      <ProjectDetail
        projectId={project.id}
        status={project.status as "IDEA" | "IN_PROGRESS" | "DONE"}
        items={items}
        comments={comments}
        me={{ displayName: session.user.displayName, color: session.user.color }}
      />
    </>
  );
}
