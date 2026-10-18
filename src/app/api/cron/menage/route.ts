import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser, hasNotificationBeenSent, logNotification } from "@/lib/push";
import { getWeekStart } from "@/lib/chores-utils";

// Appelée par le cron du VPS :
// Samedi 9h (Paris) : rappel initial  → ?type=saturday
// Dimanche 19h (Paris) : rappel si pas encore fait → ?type=sunday

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") ?? "saturday";
  const weekStart = getWeekStart();

  // Trouve l'assignment de la semaine courante
  const assignment = await prisma.choreAssignment.findFirst({
    where: { weekStart },
    include: {
      user: {
        select: { id: true, displayName: true, choresRemindersEnabled: true },
      },
    },
  });

  if (!assignment) {
    return NextResponse.json({ skipped: "no assignment found" });
  }

  const { user } = assignment;

  // Dimanche : envoyer seulement si pas encore validé
  if (type === "sunday" && assignment.status === "DONE") {
    return NextResponse.json({ skipped: "already done" });
  }

  // L'utilisateur peut avoir coupé les rappels ménage
  if (!user.choresRemindersEnabled) {
    return NextResponse.json({ skipped: "reminders disabled" });
  }

  const kind = type === "saturday" ? "chore_saturday" : "chore_sunday";
  const refId = assignment.id;

  // Anti-doublon
  if (await hasNotificationBeenSent(user.id, kind, refId)) {
    return NextResponse.json({ skipped: "already sent" });
  }

  const title = type === "saturday"
    ? "🧹 C'est ton tour cette semaine !"
    : "🧹 Rappel ménage";
  const body = type === "saturday"
    ? "Pense à passer le balai et la serpillière ce weekend."
    : "Le ménage de cette semaine n'est pas encore validé.";

  await sendPushToUser(user.id, { title, body, url: "/menage" });
  await logNotification(user.id, kind, refId);

  return NextResponse.json({ ok: true, userId: user.id, kind });
}
