import type { MetadataRoute } from "next";
import { iconUrl } from "@/lib/pwa";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "La Coloc",
    short_name: "Coloc",
    description: "Ménage, liste, projets et discussions pour la coloc",
    start_url: "/",
    display: "standalone",
    background_color: "#110f18",
    theme_color: "#110f18",
    orientation: "portrait-primary",
    icons: [
      { src: iconUrl("icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: iconUrl("icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
      { src: iconUrl("icon-maskable.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [],
  };
}
