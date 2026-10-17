import "dotenv/config";
import { randomBytes } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getWeekStart, getUserForWeek } from "../src/lib/chores-utils";

// ─── Configuration du foyer ───────────────────────────────────────────────────
// Modifie les displayName et color selon tes colocs avant de lancer.
// Les couleurs sont en hex, visibles dans l'interface.
const HOUSEHOLD_NAME = "La Coloc";

const USERS = [
  // ADMIN — toi. rotationOrder = 1 = premier dans la rotation ménage.
  { displayName: "Tobias", color: "#6366f1", role: "ADMIN" as const, rotationOrder: 1 },
  // Les 3 autres colocs — modifie les noms et couleurs
  { displayName: "Coloc 2", color: "#f59e0b", role: "COLOC" as const, rotationOrder: 2 },
  { displayName: "Coloc 3", color: "#10b981", role: "COLOC" as const, rotationOrder: 3 },
  { displayName: "Coloc 4", color: "#ef4444", role: "COLOC" as const, rotationOrder: 4 },
  // Propriétaire — pas d'ordre de rotation
  { displayName: "Propriétaire", color: "#64748b", role: "PROPRIETAIRE" as const, rotationOrder: null },
] as const;

const INVITATION_TTL_DAYS = 7;
// ─────────────────────────────────────────────────────────────────────────────

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

async function main() {
  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  // Évite de doubler le seed si relancé
  const existingHousehold = await prisma.household.findFirst();
  if (existingHousehold) {
    console.log("⚠️  La base contient déjà un foyer. Lance `prisma migrate reset` pour repartir de zéro.");
    await prisma.$disconnect();
    return;
  }

  const household = await prisma.household.create({ data: { name: HOUSEHOLD_NAME } });
  console.log(`\n✅ Foyer créé : ${household.name} (${household.id})\n`);

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  console.log("─".repeat(60));
  console.log("  Liens d'invitation (valables 7 jours) — à partager sur WhatsApp");
  console.log("─".repeat(60));

  for (const u of USERS) {
    const user = await prisma.user.create({
      data: {
        householdId: household.id,
        displayName: u.displayName,
        color: u.color,
        role: u.role,
        rotationOrder: u.rotationOrder,
      },
    });

    const token = randomBytes(32).toString("hex");
    const tokenHash = await hash(token, ARGON2_OPTIONS);

    await prisma.invitation.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const label = u.role === "ADMIN"
      ? `${u.displayName} (admin)`
      : u.role === "PROPRIETAIRE"
        ? `${u.displayName} (propriétaire)`
        : u.displayName;

    console.log(`\n  ${label}`);
    console.log(`  ${baseUrl}/invitation/${token}`);
  }

  console.log("\n" + "─".repeat(60));
  console.log("  ⚠️  Ces tokens ne sont affichés qu'une seule fois.");
  console.log("  Ils sont stockés hachés (argon2id) — impossible de les récupérer.");
  console.log("─".repeat(60) + "\n");

  // ── Génération des assignments ménage (4 prochaines semaines) ──────────────
  const colocs = await prisma.user.findMany({
    where: {
      householdId: household.id,
      role: { not: "PROPRIETAIRE" },
      rotationOrder: { not: null },
    },
    select: { id: true, rotationOrder: true, displayName: true },
  });

  const weeks = Array.from({ length: 4 }, (_, i) => {
    const d = getWeekStart();
    d.setUTCDate(d.getUTCDate() + i * 7);
    return d;
  });

  console.log("  Planning ménage (4 prochaines semaines) :");
  for (const weekStart of weeks) {
    const assigned = getUserForWeek(weekStart, colocs);
    const user = colocs.find((u) => u.id === assigned.id)!;
    await prisma.choreAssignment.create({ data: { weekStart, userId: assigned.id } });
    console.log(`  ${weekStart.toISOString().slice(0, 10)} → ${user.displayName}`);
  }
  console.log();

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
