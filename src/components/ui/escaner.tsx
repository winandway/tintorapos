"use client";

import { useEffect, useRef, useState } from "react";
import { useIdioma } from "@/lib/i18n/cliente";
import { Modal } from "./modal";

declare global {
  interface Window {
    BarcodeDetector?: new (o: { formats: string[] }) => {
      detect: (fuente: CanvasImageSource) => Promise<{ rawValue: string }[]>;
    };
  }
}

/**
 * Lector con la cámara del celular o la tablet. Usa el detector nativo del
 * navegador cuando existe y, si no (Safari), decodifica con jsQR.
 */
export function EscanerCamara({
  abierto,
  alCerrar,
  alLeer,
}: {
  abierto: boolean;
  alCerrar: () => void;
  alLeer: (texto: string) => void;
}) {
  const { d } = useIdioma();
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    let flujo: MediaStream | null = null;
    let activo = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const lienzo = document.createElement("canvas");

    async function iniciar() {
      try {
        flujo = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (!video.current) return;
        video.current.srcObject = flujo;
        await video.current.play();
      } catch {
        setError(true);
        return;
      }
      const nativo = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;
      const { default: jsQR } = nativo ? { default: null } : await import("jsqr");
      const ciclo = async () => {
        if (!activo || !video.current || video.current.readyState < 2) {
          temporizador = setTimeout(ciclo, 200);
          return;
        }
        try {
          if (nativo) {
            const [r] = await nativo.detect(video.current);
            if (r?.rawValue) return alLeer(r.rawValue);
          } else if (jsQR) {
            const v = video.current;
            lienzo.width = v.videoWidth;
            lienzo.height = v.videoHeight;
            const ctx = lienzo.getContext("2d", { willReadFrequently: true });
            ctx?.drawImage(v, 0, 0);
            const img = ctx?.getImageData(0, 0, lienzo.width, lienzo.height);
            const r = img ? jsQR(img.data, img.width, img.height) : null;
            if (r?.data) return alLeer(r.data);
          }
        } catch {
          // Un cuadro que no se pudo leer: se intenta con el siguiente.
        }
        temporizador = setTimeout(ciclo, 250);
      };
      void ciclo();
    }
    void iniciar();
    return () => {
      activo = false;
      clearTimeout(temporizador);
      flujo?.getTracks().forEach((t) => t.stop());
      setError(false);
    };
  }, [abierto, alLeer]);

  return (
    <Modal abierto={abierto} alCerrar={alCerrar} titulo={d.produccion.apuntar}>
      {error ? (
        <p className="rounded-2xl bg-alerta-suave px-4 py-3 text-alerta">{d.produccion.sinCamara}</p>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-noche">
          <video ref={video} className="aspect-square w-full object-cover" muted playsInline />
          <div
            className="pointer-events-none absolute inset-10 rounded-2xl border-4 border-white/80"
            aria-hidden="true"
          />
        </div>
      )}
    </Modal>
  );
}
