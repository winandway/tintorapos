"use client";

import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export const clasesEntrada =
  "block w-full rounded-xl border-0 bg-superficie px-3.5 py-2.5 text-[16px] text-noche ring-1 ring-inset ring-percha placeholder:text-gris-claro focus:ring-2 focus:ring-tinta focus:outline-none disabled:bg-papel disabled:text-gris aria-[invalid=true]:ring-peligro";

interface Envoltura {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string | null;
  opcional?: string;
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
  className?: string;
}

export function Campo({ etiqueta, ayuda, error, opcional, children, className = "" }: Envoltura) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const describe = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-2 text-sm font-semibold text-noche"
      >
        <span>{etiqueta}</span>
        {opcional && <span className="text-xs font-normal text-gris">{opcional}</span>}
      </label>
      {children({ id, "aria-describedby": describe, "aria-invalid": error ? true : undefined })}
      {ayuda && !error && (
        <p id={idAyuda} className="text-[13px] text-gris">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="text-[13px] font-medium text-peligro">
          {error}
        </p>
      )}
    </div>
  );
}

type PropsTexto = Omit<InputHTMLAttributes<HTMLInputElement>, "children"> & {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string | null;
  opcional?: string;
};

export function CampoTexto({ etiqueta, ayuda, error, opcional, className, ...resto }: PropsTexto) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} error={error} opcional={opcional} className={className}>
      {(a) => <input className={clasesEntrada} {...a} {...resto} />}
    </Campo>
  );
}

type PropsArea = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "children"> & {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string | null;
  opcional?: string;
};

export function CampoArea({ etiqueta, ayuda, error, opcional, className, ...resto }: PropsArea) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} error={error} opcional={opcional} className={className}>
      {(a) => <textarea className={`${clasesEntrada} min-h-20`} {...a} {...resto} />}
    </Campo>
  );
}

type PropsSelector = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  error?: string | null;
  opciones: { valor: string; texto: string }[];
};

export function CampoSelector({ etiqueta, ayuda, error, opciones, className, ...resto }: PropsSelector) {
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda} error={error} className={className}>
      {(a) => (
        <select
          className={`${clasesEntrada} appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%235e5a73'%3E%3Cpath d='M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z'/%3E%3C/svg%3E\")",
          }}
          {...a}
          {...resto}
        >
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
      )}
    </Campo>
  );
}

export function Casilla({
  etiqueta,
  ayuda,
  className = "",
  ...resto
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { etiqueta: ReactNode; ayuda?: ReactNode }) {
  const id = useId();
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 rounded-md border-percha accent-tinta"
        {...resto}
      />
      <label htmlFor={id} className="text-[15px] leading-snug text-noche">
        {etiqueta}
        {ayuda && <span className="mt-0.5 block text-[13px] text-gris">{ayuda}</span>}
      </label>
    </div>
  );
}
