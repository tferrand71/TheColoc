import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FilClient, type MessageRow, type ColocRow } from "./FilClient";
import type { MessageTag } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const TAG_LABELS: Record<MessageTag, string> = {
  MENAGE: "Ménage", BRUIT: "Bruit", ARGENT: "Argent", GENERAL: "Général",
};

interface Props {
  searchParams: Promise<{ tag?: string }>;
}

export default async function FilPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { householdId, id: currentUserId } = session.user;
  const { tag: tagParam } = await searchParams;
  const activeTag = (tagParam?.toUpperCase() as MessageTag) ?? null;

  const [messages, colocs] = await Promise.all([
    prisma.message.findMany({
      where: { householdId },
      include: {
        author: { select: { id: true, displayName: true, color: true } },
        reactions: { select: { userId: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { householdId, role: { not: "PROPRIETAIRE" } },
      select: { id: true, username: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
  ]);

  const rows: MessageRow[] = messages.map((m) => ({
    id: m.id,
    body: m.body,
    tag: m.tag,
    createdAt: m.createdAt,
    editedAt: m.editedAt,
    author: m.author,
    reactions: m.reactions,
  }));

  const colocRows: ColocRow[] = colocs;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-midnight)]">
      {/* Header */}
      <header className="lg:hidden sticky top-0 z-10 border-b border-[var(--color-hairline)] bg-[var(--color-glass-strong)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[var(--color-text-muted)]
              transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--color-text-main)]">
            ← Accueil
          </Link>
          <div className="h-4 w-px bg-[var(--color-hairline-strong)]" />
          <span className="eyebrow">Fil</span>

          {/* Filtres tags */}
          <div className="ml-auto flex gap-1.5">
            <Link href="/fil"
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors
                ${!activeTag
                  ? "border-[var(--color-mauve)]/40 bg-[var(--color-mauve)]/10 text-[var(--color-mauve-text)]"
                  : "border-[var(--color-hairline-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                }`}>
              Tous
            </Link>
            {(Object.keys(TAG_LABELS) as MessageTag[]).map((t) => (
              <Link key={t} href={`/fil?tag=${t.toLowerCase()}`}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors
                  ${activeTag === t
                    ? "border-[var(--color-mauve)]/40 bg-[var(--color-mauve)]/10 text-[var(--color-mauve-text)]"
                    : "border-[var(--color-hairline-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                  }`}>
                {TAG_LABELS[t]}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Fil — prend toute la hauteur restante */}
      <div className="mx-auto w-full max-w-2xl flex-1">
        <FilClient
          initialMessages={rows}
          colocs={colocRows}
          currentUserId={currentUserId}
          activeTag={activeTag}
        />
      </div>
    </div>
  );
}
