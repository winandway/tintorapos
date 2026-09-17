import type { MetadataRoute } from "next";
import { URL_SITIO } from "@/lib/sitio";

/** Se indexa lo público; nunca el panel, los datos, la entrada ni las páginas de estado de cada cliente. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/datos", "/media", "/t/", "/e/", "/entrar"] }],
    sitemap: `${URL_SITIO}/sitemap.xml`,
    host: URL_SITIO,
  };
}
