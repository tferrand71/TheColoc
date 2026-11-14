/**
 * Données de TEST pour le développement local (jamais pour la production).
 *
 * Crée le foyer et les mêmes colocs que prisma/seed.ts, mais avec un identifiant et un mot de passe
 * connus pour pouvoir se connecter tout de suite, sans lien d'invitation. Aucune donnée réelle n'est
 * copiée : le mot de passe ci-dessous n'existe que dans la base locale.
 *
 * Usage : npx tsx scripts/dev-seed.ts
 */
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const DEV_PASSWORD = "coloc-dev";

const USERS = [
  { username: "tobias", displayName: "Tobias", color: "#6366f1", role: "ADMIN" as const, rotationOrder: 1 },
  { username: "antoine", displayName: "Antoine", color: "#f59e0b", role: "COLOC" as const, rotationOrder: 2 },
  { username: "landry", displayName: "Landry", color: "#10b981", role: "COLOC" as const, rotationOrder: 3 },
  { username: "anass", displayName: "Anass", color: "#ef4444", role: "COLOC" as const, rotationOrder: 4 },
  { username: "thierry", displayName: "Thierry", color: "#64748b", role: "PROPRIETAIRE" as const, rotationOrder: null },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante");

  // Garde-fou : ce script n'a de sens que sur une base locale.
  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) {
    console.error(`Refus : la base visée est « ${host} », pas une base locale. Rien n'a été écrit.`);
    process.exit(1);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg(url) });
  try {
    if (await prisma.household.findFirst()) {
      console.log("La base contient déjà un foyer : rien à faire (repars de zéro avec `npx prisma migrate reset`).");
      return;
    }

    const household = await prisma.household.create({ data: { name: "La Coloc (test)" } });
    const passwordHash = await hash(DEV_PASSWORD, { memoryCost: 65536, timeCost: 3, parallelism: 4 });

    for (const u of USERS) {
      await prisma.user.create({ data: { householdId: household.id, passwordHash, ...u } });
    }

    console.log(`Foyer « ${household.name} » créé avec ${USERS.length} comptes.`);
    console.log(`Connexion : identifiant « tobias » (administrateur), mot de passe « ${DEV_PASSWORD} ».`);
    console.log("Les autres comptes (antoine, landry, anass, thierry) ont le même mot de passe, pour tester les autres rôles.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
