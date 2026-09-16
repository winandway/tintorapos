"use client";

/**
 * Achica la foto en el navegador antes de subirla (lado mayor 1600 px, JPEG):
 * de 4-8 MB de la cámara a unos 200-400 KB. Menos datos, más rápido en la tienda.
 */
export async function redimensionarFoto(archivo: Blob, ladoMax = 1600, calidad = 0.82): Promise<Blob> {
  const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, ladoMax / Math.max(imagen.width, imagen.height));
  const ancho = Math.round(imagen.width * escala);
  const alto = Math.round(imagen.height * escala);
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();
  return new Promise((resolver, rechazar) =>
    lienzo.toBlob(
      (b) => (b ? resolver(b) : rechazar(new Error("No se pudo comprimir la foto"))),
      "image/jpeg",
      calidad,
    ),
  );
}
