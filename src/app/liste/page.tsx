import { redirect } from "next/navigation";
import { ShoppingBasket } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ListeClient, type ListItemRow, type ColocRow } from "./ListeClient";

export const dynamic = "force-dynamic";

export default async function ListePage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const { id: currentUserId, householdId } = session.user;

  const [items, colocs] = await Promise.all([
    prisma.listItem.findMany({
      where: { householdId, category: "CONSOMMABLE" },
      include: {
        assignee: { select: { id: true, displayName: true, color: true } },
        author: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { householdId, role: { not: "PROPRIETAIRE" } },
      select: { id: true, displayName: true, color: true },
      orderBy: { rotationOrder: "asc" },
    }),
  ]);

  const rows: ListItemRow[] = items.map((i) => ({
    id: i.id,
    name: i.name,
    needed: i.needed,
    boughtAt: i.boughtAt,
    assignee: i.assignee,
    author: i.author,
  }));

  const colocRows: ColocRow[] = colocs;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        icon={ShoppingBasket}
        title="Courses"
        description="Les consommables communs qui manquent : PQ, liquide vaisselle, éponges…"
      />
      <ListeClient items={rows} colocs={colocRows} currentUserId={currentUserId} />
    </div>
  );
}
