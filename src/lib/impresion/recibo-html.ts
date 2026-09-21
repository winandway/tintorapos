/**
 * El recibo digital que le llega al cliente por correo. Sale de las MISMAS
 * líneas que el recibo de papel (`lineasRecibo`): lo que dice uno lo dice el
 * otro. Es HTML de correo: tablas y estilos en línea, sin hojas de estilo, sin
 * imágenes y sin código, para que se vea igual en Gmail, Outlook y el celular.
 * Donde el papel lleva el QR, el correo lleva un botón.
 * Candado: tests/unit/recibo-html.test.ts.
 */
import type { LineaRecibo } from "./recibo";

const TINTA = "#3524a8";
const GRIS = "#5e5a73";
const RAYA = "#d9d6e5";

/** Todo texto que venga de la tienda o del cliente pasa por aquí antes de entrar al HTML. */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Solo direcciones http(s): nada de `javascript:` ni de comillas que rompan el atributo. */
function enlaceSeguro(url: string): string | null {
  return /^https?:\/\/[^\s"'<>]+$/i.test(url) ? url : null;
}

export interface OpcionesCorreoHtml {
  /** A dónde lleva el botón (la página de la orden). */
  enlace: string;
  textoBoton: string;
  /** Lo que se lee en la vista previa de la bandeja, antes de abrir el correo. */
  avance: string;
  /** La línea chiquita del pie. */
  pie: string;
  idioma: "es" | "en";
}

function marco(contenido: string, o: OpcionesCorreoHtml): string {
  return `<!doctype html>
<html lang="${o.idioma}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f5fb;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1830;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escaparHtml(o.avance)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f5fb;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid ${RAYA};"><tr><td style="padding:28px 24px;">
${contenido}
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;line-height:18px;color:${GRIS};">${escaparHtml(o.pie)}</p>
</td></tr></table>
</body></html>`;
}

function boton(o: OpcionesCorreoHtml): string {
  const url = enlaceSeguro(o.enlace);
  if (!url) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto;"><tr><td style="border-radius:12px;background:${TINTA};">
<a href="${escaparHtml(url)}" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">${escaparHtml(o.textoBoton)}</a>
</td></tr></table>`;
}

/** El recibo completo, línea por línea. */
export function reciboAHtml(lineas: LineaRecibo[], o: OpcionesCorreoHtml): string {
  const partes: string[] = [];
  for (const l of lineas) {
    switch (l.t) {
      case "espacio":
        partes.push('<div style="height:12px;line-height:12px;">&nbsp;</div>');
        break;
      case "separador":
        partes.push(`<div style="border-top:1px dashed ${RAYA};margin:12px 0;"></div>`);
        break;
      case "qr":
        // El papel lleva el QR; el correo, el botón que abre lo mismo.
        partes.push(boton(o));
        break;
      case "columnas":
        partes.push(
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
            `<td style="padding:3px 0;font-size:15px;line-height:21px;${l.negrita ? "font-weight:700;" : ""}">${escaparHtml(l.izq)}</td>` +
            `<td align="right" style="padding:3px 0 3px 12px;font-size:15px;line-height:21px;white-space:nowrap;${l.negrita ? "font-weight:700;" : ""}">${escaparHtml(l.der)}</td>` +
            `</tr></table>`,
        );
        break;
      case "texto": {
        // La dirección suelta debajo del QR sobra: ya está en el botón.
        if (l.texto === o.enlace) break;
        // En el papel el servicio va sangrado debajo de su prenda; aquí, chico y gris.
        const detalle = l.texto.startsWith("   ");
        const tamano = l.grande === 3 ? 34 : l.grande === 2 ? 22 : detalle ? 13 : 15;
        const alinear = l.alinear === "centro" ? "center" : l.alinear === "der" ? "right" : "left";
        partes.push(
          `<p style="margin:${detalle ? "-2px 0 6px" : "2px 0"};text-align:${alinear};font-size:${tamano}px;line-height:${Math.round(tamano * 1.35)}px;${l.negrita ? "font-weight:700;" : ""}${l.grande === 3 ? `color:${TINTA};` : ""}${detalle ? `color:${GRIS};` : ""}">${escaparHtml(l.texto.trim())}</p>`,
        );
        break;
      }
    }
  }
  return marco(partes.join("\n"), o);
}

/** Los demás avisos («tu ropa está lista», el recordatorio): el texto y su botón. */
export function avisoAHtml(tienda: string, cuerpo: string, o: OpcionesCorreoHtml): string {
  // El texto del aviso trae la dirección escrita; en el correo va en el botón.
  const sinEnlace = cuerpo.split(o.enlace).join("").replace(/\s+/g, " ").trim();
  return marco(
    `<p style="margin:0 0 16px;text-align:center;font-size:22px;line-height:30px;font-weight:700;">${escaparHtml(tienda)}</p>
<p style="margin:0 0 20px;font-size:16px;line-height:24px;">${escaparHtml(sinEnlace)}</p>
${boton(o)}`,
    o,
  );
}

/** El mismo recibo en texto plano: va SIEMPRE junto al HTML, para quien no lo abre con formato. */
export function reciboATexto(lineas: LineaRecibo[]): string {
  const r: string[] = [];
  for (const l of lineas) {
    if (l.t === "espacio") r.push("");
    else if (l.t === "separador") r.push("------------------------------");
    else if (l.t === "columnas") r.push(`${l.izq} ${l.der}`);
    else if (l.t === "texto") r.push(l.texto.trim());
  }
  return r
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
