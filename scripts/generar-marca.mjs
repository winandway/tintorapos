// Genera íconos y la imagen para compartir a partir del isotipo SVG.
// Uso: node scripts/generar-marca.mjs   (los PNG resultantes se commitean)
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const iso = readFileSync("public/marca/isotipo.svg");
const png = (svg, tam, destino) => sharp(Buffer.from(svg)).resize(tam, tam).png().toFile(destino);

await png(iso, 512, "src/app/icon.png");
await png(iso, 180, "src/app/apple-icon.png");
await png(iso, 192, "public/iconos/icono-192.png");
await png(iso, 512, "public/iconos/icono-512.png");

// Enmascarable: el dibujo con margen de seguridad sobre el fondo de marca.
const enmascarable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#3524A8"/><g transform="translate(9.6 9.6) scale(0.7)">${iso
  .toString()
  .replace(/<svg[^>]*>|<\/svg>/g, "")
  .replace(/<rect width="64" height="64" rx="15" fill="#3524A8"\/>/, "")}</g></svg>`;
await png(enmascarable, 512, "public/iconos/icono-enmascarable-512.png");

// Tarjeta social 1200×630: fondo papel, ticket de color, logo y la promesa.
const cuerpoIso = iso.toString().replace(/<svg[^>]*>|<\/svg>/g, "");
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F6F5FB"/>
  <rect x="0" y="0" width="1200" height="14" fill="#3524A8"/>
  <g transform="translate(80 82) scale(1.5)">${cuerpoIso}</g>
  <text x="200" y="138" font-family="Helvetica Neue, Arial, sans-serif" font-size="62" font-weight="800" fill="#16122B" letter-spacing="-1">Tintora POS</text>
  <text x="80" y="290" font-family="Helvetica Neue, Arial, sans-serif" font-size="58" font-weight="800" fill="#16122B">El punto de venta para</text>
  <text x="80" y="360" font-family="Helvetica Neue, Arial, sans-serif" font-size="58" font-weight="800" fill="#3524A8">tintorerías y lavanderías</text>
  <text x="80" y="440" font-family="Helvetica Neue, Arial, sans-serif" font-size="30" fill="#5E5A73">QR por prenda · Avisos al cliente · Sin internet</text>
  <text x="80" y="486" font-family="Helvetica Neue, Arial, sans-serif" font-size="30" fill="#5E5A73">For dry cleaners &amp; laundries · English &amp; Español</text>
  <g transform="translate(930 230) rotate(8)">
    <rect x="0" y="0" width="200" height="290" rx="16" fill="#F4DC6B"/>
    <circle cx="100" cy="42" r="14" fill="#F6F5FB"/>
    <text x="100" y="150" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="72" font-weight="900" fill="#16122B">1042</text>
    <rect x="30" y="180" width="140" height="4" fill="#16122B" opacity="0.25"/>
    <text x="100" y="230" text-anchor="middle" font-family="Helvetica Neue, Arial, sans-serif" font-size="24" font-weight="700" fill="#16122B">LISTA · READY</text>
  </g>
</svg>`;
await sharp(Buffer.from(og)).png().toFile("src/app/opengraph-image.png");
await sharp(Buffer.from(og)).png().toFile("src/app/twitter-image.png");
writeFileSync(
  "src/app/opengraph-image.alt.txt",
  "Tintora POS: el punto de venta para tintorerías y lavanderías",
);
writeFileSync(
  "src/app/twitter-image.alt.txt",
  "Tintora POS: el punto de venta para tintorerías y lavanderías",
);
console.info("Marca generada.");
