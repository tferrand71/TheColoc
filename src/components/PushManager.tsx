"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, CircleCheck, Smartphone } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output.buffer as ArrayBuffer;
}

type Status = "idle" | "subscribed" | "denied" | "unsupported";

export function PushManager() {
  const [status, setStatus] = useState<Status>("idle");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    // Permission accordée ne suffit pas : il faut un abonnement enregistré sur cet appareil
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      if (sub) setStatus("subscribed");
    });
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), userAgent: navigator.userAgent }),
      });

      if (res.ok) setStatus("subscribed");
    } catch {
      // permission refusée ou service worker indisponible
    } finally {
      setLoading(false);
    }
  }

  if (status === "unsupported") {
    return (
      <p className="flex items-start gap-2.5 rounded-xl bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
        <Smartphone className="mt-0.5 h-4 w-4 flex-shrink-0" />
        Ce navigateur ne gère pas les notifications. Sur iPhone, ajoute d'abord l'app à l'écran d'accueil.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="flex items-start gap-2.5 rounded-xl bg-[var(--color-down)]/10 px-4 py-3 text-sm text-[var(--color-down)]">
        <BellOff className="mt-0.5 h-4 w-4 flex-shrink-0" />
        Notifications bloquées. Autorise-les dans les réglages du navigateur.
      </p>
    );
  }

  if (status === "subscribed") {
    return (
      <p className="flex items-center gap-2.5 rounded-xl bg-[var(--color-ok)]/10 px-4 py-3 text-sm text-[var(--color-ok)]">
        <CircleCheck className="h-4 w-4" />
        Notifications activées sur cet appareil.
      </p>
    );
  }

  return (
    <button onClick={subscribe} disabled={loading} className="btn btn-primary w-full sm:w-fit">
      <BellRing className="h-4 w-4" />
      {loading ? "Activation…" : "Activer les notifications sur cet appareil"}
    </button>
  );
}
