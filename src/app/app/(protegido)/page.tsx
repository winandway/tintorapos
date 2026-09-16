import { exigirSesion } from "@/server/pagina";

export default async function Tablero() {
  const { sesion } = await exigirSesion();
  return <h1 className="titulo-ancho text-2xl">{sesion.tintoreria.nombre}</h1>;
}
