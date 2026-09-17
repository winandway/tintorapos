import { RUTAS_AGENTES, url } from "@/lib/agentes/enlaces";
import { URL_SITIO } from "@/lib/sitio";

/**
 * Especificación de lo que Tintora POS ofrece SIN cuenta: el estado de una orden
 * con el código del recibo y el estado del servicio. Lo demás (órdenes, caja,
 * clientes) vive detrás de la sesión de cada tintorería y no se publica.
 */
export function GET() {
  const spec = {
    openapi: "3.1.0",
    info: {
      title: "Tintora POS — API pública",
      version: "1.0.0",
      summary: "Estado de una orden de tintorería y estado del servicio.",
      description:
        "Parte pública de Tintora POS, el punto de venta en la nube para tintorerías y lavanderías. Solo lectura y sin autenticación: el código del recibo es la llave. Las herramientas equivalentes para agentes están en el servidor MCP de /mcp.",
      contact: { name: "Windoce LLC", url: "https://windoce.com" },
      license: { name: "Propietario", url: url("/terminos") },
    },
    servers: [{ url: URL_SITIO }],
    externalDocs: { description: "Guías de Tintora POS", url: url(RUTAS_AGENTES.docs) },
    paths: {
      "/datos/publico/orden/{codigo}": {
        get: {
          operationId: "estadoDeOrden",
          summary: "Estado de una orden por el código del recibo",
          description:
            "Devuelve el número de orden, su estado, cuántas piezas están listas, la fecha prometida y los datos públicos de la tienda. Nunca devuelve teléfono, dirección del cliente ni importes.",
          parameters: [
            {
              name: "codigo",
              in: "path",
              required: true,
              description: "Código público del recibo (el del enlace /t/CODIGO).",
              schema: { type: "string", minLength: 6, maxLength: 40 },
            },
          ],
          responses: {
            "200": {
              description: "La orden existe.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["orden"],
                    properties: {
                      orden: {
                        type: "object",
                        properties: {
                          numero: { type: "integer" },
                          estado: {
                            type: "string",
                            enum: ["recibida", "en_proceso", "lista", "entregada", "anulada", "abandonada"],
                          },
                          piezas: { type: "integer" },
                          listas: { type: "integer" },
                          fechaPromesa: { type: "integer", description: "Milisegundos desde 1970." },
                          tieneSaldo: { type: "boolean" },
                          primerNombre: { type: "string" },
                          tienda: {
                            type: "object",
                            properties: {
                              nombre: { type: "string" },
                              telefono: { type: ["string", "null"] },
                              ciudad: { type: ["string", "null"] },
                              pais: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "404": { description: "No hay ninguna orden con ese código." },
            "429": { description: "Demasiadas consultas: espera un momento." },
          },
        },
      },
      "/datos/salud": {
        get: {
          operationId: "estadoDelServicio",
          summary: "Estado del servicio (canario)",
          description: "ok / error por pieza: base de datos, almacén, correo, avisos y respaldos.",
          responses: {
            "200": { description: "Todo en orden." },
            "503": { description: "Alguna pieza está en error." },
          },
        },
      },
      "/mcp": {
        post: {
          operationId: "mcp",
          summary: "Servidor MCP (JSON-RPC 2.0)",
          description:
            "Herramientas públicas para agentes: estado_de_orden, buscar_guias y sobre_tintora_pos. Tarjeta del servidor en /.well-known/mcp/server-card.json.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object" } } },
          },
          responses: { "200": { description: "Respuesta JSON-RPC." } },
        },
      },
    },
  };
  return Response.json(spec, {
    headers: {
      "content-type": "application/vnd.oai.openapi+json; charset=utf-8",
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
}
