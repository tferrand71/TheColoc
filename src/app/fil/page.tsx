import { redirect } from "next/navigation";
import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { FilClient, type MessageRow, type ColocRow } from "./FilClient";
import { TAG_CONFIG } from "./tags";
import type { MessageTag } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ tag?: string }>;
}

export default async function FilPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { householdId, id: currentUserId } = session.user;
  const { tag: tagParam } = await searchParams;
  const upper = tagParam?.toUpperCase();
  const activeTag = upper && upper in TAG_CONFIG ? (upper as MessageTag) : null;

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

  const chip = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${active
      ? "bg-[var(--color-surface)] text-[var(--color-text-main)] ring-1 ring-inset ring-[var(--color-hairline-strong)]"
      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"}`;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={MessagesSquare}
        title="Discussion"
        description="Le fil de la coloc. Mentionne quelqu'un avec @."
      />

      <nav className="-mx-1 mb-6 flex gap-1 overflow-x-auto px-1" aria-label="Filtrer par sujet">
        <Link href="/fil" className={chip(!activeTag)}>Tout</Link>
        {(Object.keys(TAG_CONFIG) as MessageTag[]).map((t) => (
          <Link key={t} href={`/fil?tag=${t.toLowerCase()}`} className={chip(activeTag === t)}>
            {TAG_CONFIG[t].label}
          </Link>
        ))}
      </nav>

      <FilClient
        initialMessages={rows}
        colocs={colocRows}
        currentUserId={currentUserId}
        activeTag={activeTag}
      />
    </div>
  );
}
