"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Casilla, CampoArea, CampoSelector, CampoTexto } from "@/components/ui/campo";
import { Modal } from "@/components/ui/modal";
import { ErrorApi, pedir } from "@/lib/api";
import { nuevoId } from "@/lib/codigos";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { useIdioma } from "@/lib/i18n/cliente";

export interface DatosFormCliente {
  id?: string;
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  idioma: "es" | "en";
  preferencias: {
    almidon?: "ninguno" | "ligero" | "medio" | "fuerte";
    entrega?: "gancho" | "doblado";
    sinBolsa?: boolean;
  };
  notas: string;
  aceptaSms: boolean;
  aceptaCorreo: boolean;
}

export function clienteVacio(idioma: "es" | "en", inicial: Partial<DatosFormCliente> = {}): DatosFormCliente {
  return {
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
    idioma,
    preferencias: {},
    notas: "",
    aceptaSms: false,
    aceptaCorreo: false,
    ...inicial,
  };
}

/** Crear o editar un cliente. Si el teléfono ya existe, ofrece usar ese cliente. */
export function ModalCliente({
  abierto,
  inicial,
  alCerrar,
  alGuardar,
  permitirLocal = false,
}: {
  abierto: boolean;
  inicial: DatosFormCliente | null;
  alCerrar: () => void;
  alGuardar: (id: string, datos: DatosFormCliente, local?: boolean) => void;
  /** Permite crear el cliente solo en el dispositivo cuando no hay conexión (mostrador). */
  permitirLocal?: boolean;
}) {
  const { d } = useIdioma();
  const dc = d.clientes;
  const [v, setV] = useState<DatosFormCliente | null>(inicial);
  const [origen, setOrigen] = useState<DatosFormCliente | null>(inicial);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [existente, setExistente] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  if (inicial !== origen) {
    setOrigen(inicial);
    setV(inicial);
    setCampos({});
    setError(null);
    setExistente(null);
  }
  if (!abierto || !v)
    return (
      <Modal abierto={false} alCerrar={alCerrar} titulo="">
        {null}
      </Modal>
    );

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!v) return;
    setOcupado(true);
    setError(null);
    setCampos({});
    setExistente(null);
    try {
      const cuerpo = { ...v, id: undefined };
      if (v.id) {
        await pedir(`/datos/clientes/${v.id}`, { metodo: "PUT", cuerpo });
        alGuardar(v.id, v);
      } else {
        const r = await pedir<{ id: string }>("/datos/clientes", { cuerpo });
        alGuardar(r.id, v);
      }
    } catch (err) {
      if (permitirLocal && !v.id && err instanceof ErrorApi && err.sinConexion) {
        // Sin conexión: el cliente viaja dentro de la orden y se crea al sincronizar.
        alGuardar(nuevoId(), v, true);
        return;
      }
      setError(textoError(d, err));
      setCampos(camposDe(err));
      if (err instanceof ErrorApi && err.codigo === "cliente_repetido")
        setExistente(String(err.vars.clienteId ?? ""));
    } finally {
      setOcupado(false);
    }
  }

  const set = (k: keyof DatosFormCliente, valor: unknown) => setV({ ...v, [k]: valor });
  return (
    <Modal
      abierto
      alCerrar={alCerrar}
      ancho="max-w-lg"
      titulo={v.id ? dc.editar : dc.nuevo}
      pie={
        <>
          <Boton variante="secundario" onClick={alCerrar}>
            {d.comun.cancelar}
          </Boton>
          <Boton type="submit" form="form-cliente" cargando={ocupado}>
            {d.comun.guardar}
          </Boton>
        </>
      }
    >
      <form id="form-cliente" onSubmit={guardar} className="space-y-4" noValidate>
        {error && (
          <Aviso tono="error">
            {error}
            {existente && (
              <Boton
                variante="secundario"
                tamano="chico"
                className="mt-2"
                onClick={() => alGuardar(existente, v)}
              >
                {dc.usarExistente}
              </Boton>
            )}
          </Aviso>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoTexto
            etiqueta={dc.nombre}
            placeholder={dc.nombrePlaceholder}
            autoComplete="off"
            value={v.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            error={textoCampo(d, campos.nombre)}
            autoFocus
          />
          <CampoTexto
            etiqueta={dc.apellido}
            placeholder={dc.apellidoPlaceholder}
            autoComplete="off"
            value={v.apellido}
            onChange={(e) => set("apellido", e.target.value)}
            error={textoCampo(d, campos.apellido)}
            opcional={d.comun.opcional}
          />
        </div>
        <CampoTexto
          etiqueta={dc.telefono}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder={dc.telefonoPlaceholder}
          value={v.telefono}
          onChange={(e) => set("telefono", e.target.value)}
          error={textoCampo(d, campos.telefono)}
        />
        <CampoTexto
          etiqueta={dc.correo}
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder={d.acceso.correoPlaceholder}
          value={v.correo}
          onChange={(e) => set("correo", e.target.value)}
          error={textoCampo(d, campos.correo)}
          opcional={d.comun.opcional}
        />
        <CampoSelector
          etiqueta={dc.idioma}
          value={v.idioma}
          onChange={(e) => set("idioma", e.target.value)}
          opciones={[
            { valor: "es", texto: "Español" },
            { valor: "en", texto: "English" },
          ]}
        />
        <div className="space-y-3 rounded-2xl bg-papel p-4">
          <Casilla
            etiqueta={dc.aceptaSms}
            ayuda={dc.aceptaSmsAyuda}
            checked={v.aceptaSms}
            disabled={!v.telefono.trim()}
            onChange={(e) => set("aceptaSms", e.target.checked)}
          />
          <Casilla
            etiqueta={dc.aceptaCorreo}
            checked={v.aceptaCorreo}
            disabled={!v.correo.trim()}
            onChange={(e) => set("aceptaCorreo", e.target.checked)}
          />
        </div>
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-semibold">{dc.preferencias}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <CampoSelector
              etiqueta={dc.almidon}
              value={v.preferencias.almidon ?? ""}
              onChange={(e) =>
                set("preferencias", { ...v.preferencias, almidon: e.target.value || undefined })
              }
              opciones={[
                { valor: "", texto: "—" },
                ...(["ninguno", "ligero", "medio", "fuerte"] as const).map((x) => ({
                  valor: x,
                  texto: dc.almidones[x],
                })),
              ]}
            />
            <CampoSelector
              etiqueta={dc.entrega}
              value={v.preferencias.entrega ?? ""}
              onChange={(e) =>
                set("preferencias", { ...v.preferencias, entrega: e.target.value || undefined })
              }
              opciones={[
                { valor: "", texto: "—" },
                { valor: "gancho", texto: dc.entregas.gancho },
                { valor: "doblado", texto: dc.entregas.doblado },
              ]}
            />
          </div>
          <Casilla
            etiqueta={dc.sinBolsa}
            checked={Boolean(v.preferencias.sinBolsa)}
            onChange={(e) =>
              set("preferencias", { ...v.preferencias, sinBolsa: e.target.checked || undefined })
            }
          />
        </fieldset>
        <CampoArea
          etiqueta={dc.notas}
          placeholder={dc.notasPlaceholder}
          value={v.notas}
          onChange={(e) => set("notas", e.target.value)}
          error={textoCampo(d, campos.notas)}
          opcional={d.comun.opcional}
        />
      </form>
    </Modal>
  );
}
