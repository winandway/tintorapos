"use client";

import { useState } from "react";
import { Aviso, useAvisar } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoSelector, CampoTexto } from "@/components/ui/campo";
import { CampoClave } from "@/components/ui/campo-clave";
import { MenuTresPuntos } from "@/components/ui/menu-tres-puntos";
import { Modal } from "@/components/ui/modal";
import { pedir } from "@/lib/api";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { fmt, formatoFecha } from "@/lib/i18n";
import { useIdioma } from "@/lib/i18n/cliente";
import { useDatos } from "@/lib/use-datos";

type Rol = "dueno" | "gerente" | "cajero" | "planta" | "repartidor";

interface Empleado {
  id: string;
  nombre: string;
  rol: Rol;
  correo: string | null;
  tienePin: boolean;
  totpActivo: boolean;
  activo: boolean;
  ultimoIngresoEn: number | null;
  bloqueadoHasta: number | null;
}

function puedeGestionar(actor: Rol, objetivo: Rol) {
  if (actor === "dueno") return true;
  return actor === "gerente" && objetivo !== "dueno" && objetivo !== "gerente";
}

export function GestionEmpleados({ miRol, miId, zona }: { miRol: Rol; miId: string; zona: string }) {
  const { d, idioma } = useIdioma();
  const avisar = useAvisar();
  const { datos, error, recargar } = useDatos<{ empleados: Empleado[] }>("/datos/empleados");
  const [editando, setEditando] = useState<Partial<Empleado> | null>(null);
  const de = d.ajustes.empleados;

  async function cambiarEstado(e: Empleado, activo: boolean) {
    try {
      await pedir(`/datos/empleados/${e.id}`, { metodo: "PATCH", cuerpo: { activo } });
      recargar();
      avisar(d.comun.guardado);
    } catch (err) {
      avisar(textoError(d, err), "error");
    }
  }

  if (!datos)
    return error ? (
      <Aviso tono="error">{textoError(d, error)}</Aviso>
    ) : (
      <p className="text-gris">{d.comun.cargando}</p>
    );
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Boton onClick={() => setEditando({ rol: "cajero" })}>+ {de.agregar}</Boton>
      </div>
      <ul className="divide-y divide-percha/60 overflow-hidden rounded-3xl bg-superficie ring-1 ring-percha/80">
        {datos.empleados.map((e) => (
          <li key={e.id} className={`flex items-center gap-3 px-5 py-3.5 ${e.activo ? "" : "opacity-55"}`}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tinta-suave text-[15px] font-bold text-tinta">
              {e.nombre.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold">{e.nombre}</p>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-gris">
                <span className="font-semibold text-noche">{d.app.roles[e.rol]}</span>
                {e.correo && <span className="truncate">{e.correo}</span>}
                <Etiqueta tono={e.tienePin ? "ok" : "gris"}>{e.tienePin ? de.conPin : de.sinPin}</Etiqueta>
                {e.totpActivo && <Etiqueta tono="ok">{de.dosPasos}</Etiqueta>}
                {e.bloqueadoHasta && <Etiqueta tono="peligro">{de.bloqueado}</Etiqueta>}
                {!e.activo && <Etiqueta tono="gris">{de.inactivo}</Etiqueta>}
              </p>
              <p className="text-[12px] text-gris-claro">
                {e.ultimoIngresoEn
                  ? fmt(de.ultimoIngreso, { fecha: formatoFecha(e.ultimoIngresoEn, idioma, zona) })
                  : de.nunca}
              </p>
            </div>
            {puedeGestionar(miRol, e.rol) && (
              <MenuTresPuntos
                opciones={[
                  { texto: de.editar, alElegir: () => setEditando(e) },
                  e.activo
                    ? {
                        texto: de.desactivar,
                        oculta: e.id === miId,
                        alElegir: () => cambiarEstado(e, false),
                        destructiva: {
                          titulo: fmt(de.confirmarDesactivar, { nombre: e.nombre }),
                          mensaje: de.confirmarDesactivarTexto,
                          confirmar: de.desactivar,
                        },
                      }
                    : { texto: de.activar, alElegir: () => cambiarEstado(e, true) },
                ]}
              />
            )}
          </li>
        ))}
      </ul>
      <ModalEmpleado
        editando={editando}
        miRol={miRol}
        alCerrar={() => setEditando(null)}
        alGuardar={() => {
          setEditando(null);
          recargar();
          avisar(d.comun.guardado);
        }}
      />
    </div>
  );
}

function Etiqueta({ tono, children }: { tono: "ok" | "gris" | "peligro"; children: React.ReactNode }) {
  const c = {
    ok: "bg-ok-suave text-ok",
    gris: "bg-papel text-gris",
    peligro: "bg-peligro-suave text-peligro",
  }[tono];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c}`}>{children}</span>;
}

function ModalEmpleado({
  editando,
  miRol,
  alCerrar,
  alGuardar,
}: {
  editando: Partial<Empleado> | null;
  miRol: Rol;
  alCerrar: () => void;
  alGuardar: () => void;
}) {
  const { d } = useIdioma();
  const de = d.ajustes.empleados;
  const [v, setV] = useState({ nombre: "", rol: "cajero" as Rol, pin: "", correo: "", claveTemporal: "" });
  const [cargadoDe, setCargadoDe] = useState<Partial<Empleado> | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  if (editando !== cargadoDe) {
    setCargadoDe(editando);
    setV({
      nombre: editando?.nombre ?? "",
      rol: editando?.rol ?? "cajero",
      pin: "",
      correo: editando?.correo ?? "",
      claveTemporal: "",
    });
    setCampos({});
    setError(null);
  }
  if (!editando)
    return (
      <Modal abierto={false} alCerrar={alCerrar} titulo="">
        {null}
      </Modal>
    );

  const esNuevo = !editando.id;
  const conCuenta = v.rol === "dueno" || v.rol === "gerente";
  const roles: Rol[] = (["dueno", "gerente", "cajero", "planta", "repartidor"] as Rol[]).filter((r) =>
    puedeGestionar(miRol, r),
  );
  const necesitaClave =
    conCuenta &&
    v.correo.trim() !== "" &&
    (esNuevo || !editando.correo || v.correo.trim() !== editando.correo);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    setCampos({});
    const cuerpo = {
      nombre: v.nombre,
      rol: v.rol,
      ...(v.pin ? { pin: v.pin } : {}),
      correo: conCuenta ? v.correo.trim() : "",
      ...(conCuenta && v.claveTemporal ? { claveTemporal: v.claveTemporal } : {}),
    };
    try {
      await pedir(esNuevo ? "/datos/empleados" : `/datos/empleados/${editando!.id}`, {
        metodo: esNuevo ? "POST" : "PUT",
        cuerpo,
      });
      alGuardar();
    } catch (err) {
      setError(textoError(d, err));
      setCampos(camposDe(err));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal
      abierto
      alCerrar={alCerrar}
      titulo={esNuevo ? de.agregar : de.editar}
      pie={
        <>
          <Boton variante="secundario" onClick={alCerrar}>
            {d.comun.cancelar}
          </Boton>
          <Boton type="submit" form="form-empleado" cargando={ocupado}>
            {d.comun.guardar}
          </Boton>
        </>
      }
    >
      <form id="form-empleado" onSubmit={guardar} className="space-y-4" noValidate autoComplete="off">
        {error && <Aviso tono="error">{error}</Aviso>}
        <CampoTexto
          etiqueta={de.nombre}
          placeholder={de.nombrePlaceholder}
          value={v.nombre}
          onChange={(e) => setV({ ...v, nombre: e.target.value })}
          error={textoCampo(d, campos.nombre)}
        />
        <div>
          <CampoSelector
            etiqueta={de.rol}
            value={v.rol}
            onChange={(e) => setV({ ...v, rol: e.target.value as Rol })}
            opciones={roles.map((r) => ({ valor: r, texto: d.app.roles[r] }))}
          />
          <p className="mt-1 text-[13px] text-gris">{de.descripcionRoles[v.rol]}</p>
        </div>
        <CampoClave
          etiqueta={esNuevo ? de.pin : de.pinNuevo}
          inputMode="numeric"
          maxLength={6}
          autoComplete="off"
          value={v.pin}
          onChange={(e) => setV({ ...v, pin: e.target.value.replace(/\D/g, "") })}
          ayuda={de.pinAyuda}
          error={textoCampo(d, campos.pin)}
        />
        {conCuenta && (
          <fieldset className="space-y-3 rounded-2xl bg-papel p-4">
            <legend className="px-1 text-sm font-bold">{de.accesoCuenta}</legend>
            <p className="text-[13px] text-gris">{de.accesoAyuda}</p>
            <CampoTexto
              etiqueta={de.correo}
              type="email"
              inputMode="email"
              placeholder={d.acceso.correoPlaceholder}
              value={v.correo}
              onChange={(e) => setV({ ...v, correo: e.target.value })}
              error={textoCampo(d, campos.correo)}
              opcional={d.comun.opcional}
            />
            {(necesitaClave || (v.correo && v.claveTemporal)) && (
              <CampoClave
                etiqueta={de.claveTemporal}
                autoComplete="new-password"
                value={v.claveTemporal}
                onChange={(e) => setV({ ...v, claveTemporal: e.target.value })}
                ayuda={de.claveTemporalAyuda}
                error={textoCampo(d, campos.claveTemporal ?? campos.clave)}
              />
            )}
          </fieldset>
        )}
      </form>
    </Modal>
  );
}
