"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output.buffer as ArrayBuffer;
}

export function PushManager({ choresEnabled }: { choresEnabled: boolean }) {
  const [status, setStatus] = useState<"idle" | "subscribed" | "denied" | "unsupported">("idle");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") setStatus("denied");
    else if (Notification.permission === "granted") setStatus("subscribed");
  }, []);

  async function subscribe() {
    if (!("serviceWorker" in navigator)) return;
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
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      if (res.ok) setStatus("subscribed");
    } catch {
      // permission refusée ou erreur SW
    } finally {
      setLoading(false);
    }
  }

  if (status === "unsupported") {
    return (
      <div className="rounded-xl border border-[var(--color-hairline)] bg-[var(--color-raised)] px-4 py-3">
        <p className="text-sm text-[var(--color-text-muted)]">
          Les notifications ne sont pas supportées sur ce navigateur.
          {" "}Sur iPhone, ajoute l'app à l'écran d'accueil d'abord.
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
        <p className="text-sm text-red-400">
          Notifications bloquées. Autorise-les dans les réglages du navigateur.
        </p>
      </div>
    );
  }

  if (status === "subscribed") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-[var(--color-ok)]/20
        bg-[var(--color-ok)]/5 px-4 py-3">
        <span className="text-[var(--color-ok)]">✓</span>
        <p className="text-sm text-[var(--color-ok)]">Notifications activées sur cet appareil.</p>
      </div>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={loading}
      className="w-full rounded-xl bg-[var(--color-mauve)] px-4 py-3 text-sm font-semibold text-white
        transition hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Activation…" : "Activer les notifications push"}
    </button>
  );
}
