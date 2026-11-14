"use client";

import { useEffect } from "react";

// Fréquence de vérification d'une nouvelle version quand l'appli reste ouverte (un PWA installé peut
// rester des jours en arrière-plan sans jamais recharger une page).
const UPDATE_CHECK_MS = 60 * 60 * 1000;

/**
 * Vrai si un champ de la page contient du texte saisi : recharger le ferait perdre. Un champ vide,
 * même s'il a le focus (l'écran de connexion le donne tout seul), ne compte pas.
 */
function hasTypedInput(): boolean {
  const fields = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea"
  );
  if (Array.from(fields).some((field) => field.value.trim() !== "")) return true;
  const el = document.activeElement;
  return el instanceof HTMLElement && el.isContentEditable && (el.textContent ?? "").trim() !== "";
}

/**
 * Enregistre le service worker et garde l'appli à jour toute seule :
 *  1. vérifie s'il existe une nouvelle version à chaque retour dans l'appli, puis toutes les heures ;
 *  2. le service worker (skipWaiting + clientsClaim, voir app/sw.ts) s'active dès qu'il est installé ;
 *  3. la page, qui tourne encore avec l'ancien code, se recharge alors. Si du texte est en cours de saisie,
 *     on attend que l'appli passe en arrière-plan pour ne rien faire perdre.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    // La page était-elle déjà pilotée par un service worker ? Si oui, un changement de contrôleur
    // signale une nouvelle version. Sinon c'est la toute première installation : rien à recharger.
    let hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;

    function reloadWhenSafe() {
      if (reloading) return;
      if (document.visibilityState === "hidden" || !hasTypedInput()) {
        reloading = true;
        window.location.reload();
        return;
      }
      // Du texte est en cours de saisie : on réessaie au prochain changement de visibilité
      document.addEventListener("visibilitychange", reloadWhenSafe, { once: true });
    }

    function onControllerChange() {
      if (!hadController) {
        hadController = true;
        return;
      }
      reloadWhenSafe();
    }
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let registration: ServiceWorkerRegistration | undefined;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        registration = reg;
      })
      .catch(() => {});

    function checkForUpdate() {
      registration?.update().catch(() => {});
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") checkForUpdate();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    const timer = window.setInterval(checkForUpdate, UPDATE_CHECK_MS);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("visibilitychange", reloadWhenSafe);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
