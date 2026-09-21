import Link from "next/link";
import { Mostrador } from "@/components/mostrador/mostrador";
import { Aviso } from "@/components/ui/aviso";
import { clasesBoton } from "@/components/ui/boton";
import { obtenerTextos } from "@/lib/i18n/servidor";
import { rutaPagina } from "@/lib/rutas-publicas";
import { politicaCobro, unidadPeso } from "@/server/ajustes/tienda";
import { exigirSesion } from "@/server/pagina";
import { pruebaTerminada } from "@/server/prueba";

export default async function PaginaMostrador({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { sesion, db } = await exigirSesion("ordenes.crear");
  const { cliente } = await searchParams;
  const t = sesion.tintoreria;
  const { idioma, d } = await obtenerTextos();
  const cobro = await politicaCobro(db, t.id);
  const peso = await unidadPeso(db, t.id);
  // Con la prueba vencida no se reciben órdenes nuevas: se dice claro, no se
  // deja que el botón falle al final.
  if (pruebaTerminada(t))
    return (
      <div className="mx-auto max-w-2xl py-6">
        <Aviso tono="alerta" titulo={d.app.pruebaTermino}>
          <p>{d.errores.prueba_terminada}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={rutaPagina(idioma, "contacto")} className={clasesBoton("primario", "normal")}>
              {d.precios.hablar}
            </Link>
            <Link href="/app/ajustes/datos" className={clasesBoton("secundario", "normal")}>
              {d.ajustes.secciones.datos.titulo}
            </Link>
          </div>
        </Aviso>
      </div>
    );
  return (
    <Mostrador
      tienda={{
        moneda: t.moneda,
        zona: t.zonaHoraria,
        pais: t.pais,
        diasEntrega: t.diasEntrega,
        politicaCobro: cobro,
        unidadPeso: peso,
        reglas: {
          impuestoBps: t.impuestoBps,
          recargoUrgenteBps: t.recargoUrgenteBps,
          descuentoMaxBps: t.descuentoMaxBps,
        },
      }}
      clienteInicial={typeof cliente === "string" && /^[0-9a-f-]{36}$/.test(cliente) ? cliente : null}
    />
  );
}
