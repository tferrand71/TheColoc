import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AnnouncementDetail } from "./AnnouncementDetail";

export const dynamic = "force-dynamic";

const TYPE_CONFIG = {
  REUNION:     { label: "Réunion",     icon: "📅" },
  VISITE:      { label: "Visite",      icon: "🚪" },
  TRAVAUX:     { label: "Travaux",     icon: "🔨" },
  INFORMATION: { label: "Information", icon: "ℹ️" },
  AUTRE:       { label: "Autre",       icon: "📌" },
} as const;

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

  const cfg = TYPE_CONFIG[ann.type];
  const myResponse = ann.responses.find((r) => r.userId === userId);
  const isProprietaire = role === "PROPRIETAIRE";
  const needsResponse = ["REUNION", "VISITE"].includes(ann.type);

  return (
    <div className="min-h-screen bg-[var(--color-midnight)]">
      <header className="lg:hidden sticky top-0 z-10 border-b border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/annonces"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[var(--color-text-muted)]
              transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]">
            ← Annonces
          </Link>
          <div className="h-4 w-px bg-[var(--color-hairline-strong)]" />
          <span className="eyebrow truncate">{ann.title}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl animate-rise px-4 py-8">
        {/* En-tête annonce */}
        <div className="mb-6 rounded-2xl border border-[var(--color-gold)]/20 bg-[var(--color-gold)]/5 p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">{cfg.icon}</span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-xl font-bold text-[var(--color-text-main)]">{ann.title}</h1>
                <span className="rounded-full border border-[var(--color-gold)]/30 px-2 py-0.5 text-[10px] text-[var(--color-gold)]">
                  {cfg.label}
                </span>
              </div>
              {ann.eventAt && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  📅 {ann.eventAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
              <p className="mt-3 text-sm text-[var(--color-text-main)] leading-relaxed">{ann.body}</p>
              <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                {ann.author.displayName} ·{" "}
                {ann.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              </p>
            </div>
          </div>
        </div>

        <AnnouncementDetail
          announcementId={ann.id}
          needsResponse={needsResponse}
          isProprietaire={isProprietaire}
          myAnswer={myResponse?.answer ?? null}
          responses={ann.responses.map((r) => ({
            userId: r.userId,
            displayName: r.user.displayName,
            color: r.user.color,
            answer: r.answer,
            readAt: r.readAt,
          }))}
        />
      </main>
    </div>
  );
}
