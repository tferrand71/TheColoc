import sharp from "sharp";

const icon512 = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#13111c"/>
  <path d="M256 110 L90 248 H128 V392 H220 V312 H292 V392 H384 V248 H422 Z" fill="#8b5cf6"/>
  <rect x="220" y="312" width="72" height="80" rx="8" fill="#6d28d9"/>
</svg>`);

const maskable512 = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#13111c"/>
  <path d="M256 140 L130 252 H160 V372 H228 V302 H284 V372 H352 V252 H382 Z" fill="#8b5cf6"/>
  <rect x="228" y="302" width="56" height="70" rx="6" fill="#6d28d9"/>
</svg>`);

await sharp(icon512).resize(192, 192).png().toFile("public/icons/icon-192.png");
console.log("✓ icon-192.png");
await sharp(icon512).resize(512, 512).png().toFile("public/icons/icon-512.png");
console.log("✓ icon-512.png");
await sharp(maskable512).resize(512, 512).png().toFile("public/icons/icon-maskable.png");
console.log("✓ icon-maskable.png");
