import { RUTAS_AGENTES, url } from "@/lib/agentes/enlaces";

/** Catálogo de API (RFC 9727): dónde está la especificación, la documentación y el estado. */
export function GET() {
  const cuerpo = {
    linkset: [
      {
        anchor: url("/datos"),
        "service-desc": [{ href: url(RUTAS_AGENTES.openapi), type: "application/vnd.oai.openapi+json" }],
        "service-doc": [{ href: url(RUTAS_AGENTES.docs), type: "text/html" }],
        status: [{ href: url(RUTAS_AGENTES.estadoApi), type: "application/json" }],
        describedby: [{ href: url(RUTAS_AGENTES.llms), type: "text/plain" }],
      },
      {
        anchor: url(RUTAS_AGENTES.mcp),
        "service-desc": [{ href: url(RUTAS_AGENTES.tarjetaMcp), type: "application/json" }],
        "service-doc": [{ href: url(RUTAS_AGENTES.docs), type: "text/html" }],
      },
    ],
  };
  return Response.json(cuerpo, {
    headers: {
      "content-type": "application/linkset+json; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
}
