import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Initialisé au premier envoi : les clés n'existent qu'au runtime, pas pendant `next build`
let vapidReady = false;
function ensureVapid() {
  if (vapidReady) return;
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidReady = true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Résultat d'un envoi : permet à l'appelant de savoir si quelqu'un a vraiment reçu le message. */
export interface PushDelivery {
  /** Appareils abonnés de l'utilisateur au moment de l'envoi. */
  devices: number;
  /** Appareils dont le service de push (Apple, Google, Mozilla) a accepté le message. */
  delivered: number;
}

/**
 * Envoie une notification push à tous les appareils d'un utilisateur.
 * Ne lève jamais d'erreur d'envoi : c'est à l'appelant de lire `delivered`.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<PushDelivery> {
  ensureVapid();
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

  return {
    devices: subscriptions.length,
    delivered: results.filter((r) => r.status === "fulfilled").length,
  };
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
