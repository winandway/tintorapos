"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { CampoTexto } from "@/components/ui/campo";
import { pedir } from "@/lib/api";
import { camposDe, textoCampo, textoError } from "@/lib/errores-cliente";
import { useIdioma } from "@/lib/i18n/cliente";

export function FormContacto() {
  const { d } = useIdioma();
  const c = d.contacto;
  const [v, setV] = useState({ nombre: "", correo: "", asunto: "", mensaje: "" });
  const [estado, setEstado] = useState<"listo" | "enviando" | "enviado">("listo");
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const cambiar = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV({ ...v, [k]: e.target.value });

  if (estado === "enviado")
    return (
      <Aviso tono="ok" titulo={c.gracias}>
        {c.graciasTexto}
      </Aviso>
    );

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setEstado("enviando");
        setError(null);
        setCampos({});
        try {
          await pedir("/datos/contacto", { cuerpo: v });
          setEstado("enviado");
        } catch (err) {
          setError(textoError(d, err));
          setCampos(camposDe(err));
          setEstado("listo");
        }
      }}
    >
      {error && <Aviso tono="error">{error}</Aviso>}
      <CampoTexto
        etiqueta={c.nombre}
        placeholder={c.nombrePlaceholder}
        autoComplete="name"
        value={v.nombre}
        onChange={cambiar("nombre")}
        error={textoCampo(d, campos.nombre)}
      />
      <CampoTexto
        etiqueta={c.correo}
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={c.correoPlaceholder}
        value={v.correo}
        onChange={cambiar("correo")}
        error={textoCampo(d, campos.correo)}
      />
      <CampoTexto
        etiqueta={c.asunto}
        opcional={d.comun.opcional}
        placeholder={c.asuntoPlaceholder}
        value={v.asunto}
        onChange={cambiar("asunto")}
        error={textoCampo(d, campos.asunto)}
      />
      <label className="block">
        <span className="text-sm font-semibold text-noche">{c.mensaje}</span>
        <textarea
          rows={6}
          value={v.mensaje}
          onChange={cambiar("mensaje")}
          placeholder={c.mensajePlaceholder}
          className="mt-1.5 block w-full rounded-xl bg-papel px-3.5 py-2.5 text-[16px] ring-1 ring-percha focus:ring-2 focus:ring-tinta focus:outline-none"
        />
        {campos.mensaje && (
          <span className="mt-1 block text-[13px] text-peligro">{textoCampo(d, campos.mensaje)}</span>
        )}
      </label>
      <Boton type="submit" ancho tamano="grande" cargando={estado === "enviando"}>
        {estado === "enviando" ? c.enviando : c.enviar}
      </Boton>
    </form>
  );
}
