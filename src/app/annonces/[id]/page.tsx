import { notFound, redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, PageHeader } from "@/components/ui";
import { markAnnouncementRead } from "../actions";
import { ANNOUNCEMENT_TYPES } from "../types";
import { AnnouncementDetail } from "./AnnouncementDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnnoncePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { id } = await params;
  const { id: userId, householdId, role } = session.user;

  const ann = await prisma.announcement.findUnique({
    where: { id },
    include: {
      author: { select: { displayName: true, color: true } },
      responses: {
        include: { user: { select: { id: true, displayName: true, color: true } } },
      },
    },
  });

  if (!ann || ann.householdId !== householdId) notFound();

  const type = ANNOUNCEMENT_TYPES[ann.type];
  const Icon = type.icon;
  const myResponse = ann.responses.find((r) => r.userId === userId);
  const isProprietaire = role === "PROPRIETAIRE";
  const needsResponse = ["REUNION", "VISITE"].includes(ann.type);

  if (!isProprietaire && !myResponse?.readAt) {
    await markAnnouncementRead(ann.id);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back={{ href: "/annonces", label: "Annonces" }} title={ann.title} />

      <article className="card mb-8 p-6">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="badge-mauve"><Icon className="h-3 w-3" />{type.label}</span>
          {ann.eventAt && (
            <span className="flex items-center gap-1.5 text-sm capitalize text-[var(--color-text-main)]">
              <CalendarDays className="h-4 w-4 text-[var(--color-mauve-text)]" />
              {ann.eventAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </div>
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--color-text-main)]">{ann.body}</p>
        <div className="mt-6 flex items-center gap-2 border-t border-[var(--color-hairline)] pt-4 text-xs text-[var(--color-text-muted)]">
          <Avatar name={ann.author.displayName} color={ann.author.color} size="xs" />
          {ann.author.displayName} · {ann.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
        </div>
      </article>

      <AnnouncementDetail
        announcementId={ann.id}
        needsResponse={needsResponse}
        isProprietaire={isProprietaire}
        isArchived={!!ann.archivedAt}
        myAnswer={myResponse?.answer ?? null}
        responses={ann.responses.map((r) => ({
          userId: r.userId,
          displayName: r.user.displayName,
          color: r.user.color,
          answer: r.answer,
          readAt: r.readAt,
        }))}
      />
    </div>
  );
}
