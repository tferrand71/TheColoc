import type { NextConfig } from "next";
import withSerwist from "@serwist/next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Dev sous Turbopack (Serwist y est désactivé) ; le build de prod passe par --webpack
  turbopack: {},
};

export default withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
