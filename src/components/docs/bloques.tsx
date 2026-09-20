import type { Bloque } from "@/lib/docs";
import { diccionario, type Idioma } from "@/lib/i18n";
import { Captura } from "@/components/sitio/captura";
import { Figura } from "./figuras";
import { TextoRico } from "./texto-rico";

export function Bloques({ bloques, idioma }: { bloques: Bloque[]; idioma: Idioma }) {
  const d = diccionario(idioma).docs;
  return (
    <div className="text-[17px] leading-relaxed text-noche/90">
      {bloques.map((b, i) => {
        switch (b.t) {
          case "p":
            return (
              <p key={i} className="mt-4">
                <TextoRico texto={b.texto} idioma={idioma} />
              </p>
            );
          case "h2":
            return (
              <h2 key={i} className="titulo-ancho mt-10 text-2xl leading-tight text-noche">
                {b.texto}
              </h2>
            );
          case "pasos":
            return (
              <ol key={i} className="mt-4 space-y-3">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="numero-ticket mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-tinta-suave text-base text-tinta">
                      {j + 1}
                    </span>
                    <span>
                      <TextoRico texto={it} idioma={idioma} />
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "lista":
            return (
              <ul key={i} className="mt-4 list-disc space-y-2 pl-6 marker:text-tinta">
                {b.items.map((it, j) => (
                  <li key={j}>
                    <TextoRico texto={it} idioma={idioma} />
                  </li>
                ))}
              </ul>
            );
          case "nota":
            return (
              <aside
                key={i}
                className={`mt-6 rounded-xl border-l-4 px-4 py-3 ${
                  b.tono === "importante" ? "border-alerta bg-alerta-suave" : "border-tinta bg-tinta-suave"
                }`}
              >
                <p
                  className={`text-xs font-bold tracking-wider uppercase ${b.tono === "importante" ? "text-alerta" : "text-tinta"}`}
                >
                  {b.tono === "importante" ? d.importante : d.consejo}
                </p>
                <p className="mt-1 text-[16px]">
                  <TextoRico texto={b.texto} idioma={idioma} />
                </p>
              </aside>
            );
          case "figura":
            return <Figura key={i} nombre={b.figura} pie={b.pie} idioma={idioma} />;
          case "captura":
            return (
              <figure key={i} className="mt-6">
                <Captura clave={b.captura} idioma={idioma} conPie={false} />
                {b.pie && <figcaption className="mt-2 text-center text-[14px] text-gris">{b.pie}</figcaption>}
              </figure>
            );
        }
      })}
    </div>
  );
}
