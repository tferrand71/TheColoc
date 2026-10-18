import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ProfilClient } from "./ProfilClient";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, color: true, username: true, choresRemindersEnabled: true },
  });
  if (!user) redirect("/connexion");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader icon={UserRound} title="Mon profil" description="Notifications et sécurité du compte." />
      <ProfilClient
        displayName={user.displayName}
        color={user.color}
        username={user.username}
        choresEnabled={user.choresRemindersEnabled}
      />
    </div>
  );
}
