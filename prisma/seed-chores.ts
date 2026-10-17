import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getWeekStart, getUserForWeek, formatWeekRange } from "../src/lib/chores-utils";

async function main() {
  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });

  const household = await prisma.household.findFirst();
  if (!household) {
    console.log("Pas de foyer trouvé.");
    await prisma.$disconnect();
    return;
  }

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

  console.log("\n  Planning ménage (4 prochaines semaines) :");
  for (const weekStart of weeks) {
    const assigned = getUserForWeek(weekStart, colocs);
    const user = colocs.find((u) => u.id === assigned.id)!;
    await prisma.choreAssignment.upsert({
      where: { weekStart_userId: { weekStart, userId: assigned.id } },
      create: { weekStart, userId: assigned.id },
      update: {},
    });
    console.log(`  ${formatWeekRange(weekStart)} → ${user.displayName}`);
  }
  console.log();

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
