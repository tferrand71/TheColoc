import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { AdminTable, type UserRow } from "./AdminTable";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    where: { householdId: session.user.householdId },
    include: { invitation: true },
    orderBy: [{ rotationOrder: "asc" }, { createdAt: "asc" }],
  });

  const now = new Date();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const rows: UserRow[] = users.map((u) => {
    const inv = u.invitation;
    const invitationStatus: UserRow["invitationStatus"] =
      inv?.usedAt ? "active" :
      inv && inv.expiresAt > now ? "pending" :
      "expired";

    return {
      id: u.id,
      displayName: u.displayName,
      color: u.color,
      username: u.username,
      role: u.role as UserRow["role"],
      invitationStatus,
      invitationExpiresAt: inv
        ? inv.expiresAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
        : null,
    };
  });

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="Comptes"
        description="Suivi des invitations. Régénère un lien pour un compte pas encore activé ou un mot de passe oublié."
      />

      <AdminTable users={rows} baseUrl={baseUrl} />

      <p className="mt-6 flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
        <KeyRound className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        Un lien n'est affiché qu'une seule fois après génération : il est stocké haché et ne peut pas être retrouvé.
      </p>
    </>
  );
}
