import { Mostrador } from "@/components/mostrador/mostrador";
import { exigirSesion } from "@/server/pagina";

export default async function PaginaMostrador({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { sesion } = await exigirSesion("ordenes.crear");
  const { cliente } = await searchParams;
  const t = sesion.tintoreria;
  return (
    <Mostrador
      tienda={{
        moneda: t.moneda,
        zona: t.zonaHoraria,
        pais: t.pais,
        diasEntrega: t.diasEntrega,
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
