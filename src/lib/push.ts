import webpush from "web-push";
import { prisma } from "@/lib/prisma";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Envoie une notification push à tous les appareils d'un utilisateur. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async (err: { statusCode?: number }) => {
        // Subscription expirée (410 Gone) → supprimer
        if (err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
        throw err;
      })
    )
  );

  return results;
}

/** Vérifie si une notif a déjà été envoyée (anti-doublon). */
export async function hasNotificationBeenSent(
  userId: string,
  kind: string,
  refId: string
): Promise<boolean> {
  const existing = await prisma.notificationLog.findUnique({
    where: { userId_kind_refId: { userId, kind, refId } },
  });
  return !!existing;
}

/** Enregistre une notif envoyée dans le log. */
export async function logNotification(
  userId: string,
  kind: string,
  refId: string
): Promise<void> {
  await prisma.notificationLog.upsert({
    where: { userId_kind_refId: { userId, kind, refId } },
    create: { userId, kind, refId },
    update: { sentAt: new Date() },
  });
}
