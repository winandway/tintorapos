"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Tono = "info" | "ok" | "alerta" | "error";

const TONOS: Record<Tono, string> = {
  info: "bg-tinta-suave text-tinta-oscura ring-tinta/20",
  ok: "bg-ok-suave text-ok ring-ok/20",
  alerta: "bg-alerta-suave text-alerta ring-alerta/25",
  error: "bg-peligro-suave text-peligro ring-peligro/25",
};

export function Aviso({
  tono = "info",
  titulo,
  children,
  className = "",
}: {
  tono?: Tono;
  titulo?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Un error que no se ve es un error que no existe para la persona.
    if (tono === "error") ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [tono, children]);
  return (
    <div
      ref={ref}
      role={tono === "error" ? "alert" : "status"}
      className={`rounded-2xl px-4 py-3 text-[15px] ring-1 ring-inset ${TONOS[tono]} ${className}`}
    >
      {titulo && <p className="font-semibold">{titulo}</p>}
      {children && <div className={titulo ? "mt-0.5 opacity-90" : ""}>{children}</div>}
    </div>
  );
}

interface Tostada {
  id: number;
  tono: Tono;
  texto: string;
}

const ContextoTostadas = createContext<(texto: string, tono?: Tono) => void>(() => {});

export function ProveedorTostadas({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Tostada[]>([]);
  const avisar = useCallback((texto: string, tono: Tono = "ok") => {
    const id = Date.now() + Math.random();
    setLista((l) => [...l.slice(-2), { id, tono, texto }]);
    setTimeout(() => setLista((l) => l.filter((t) => t.id !== id)), tono === "error" ? 7000 : 3500);
  }, []);
  const valor = useMemo(() => avisar, [avisar]);
  return (
    <ContextoTostadas.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {lista.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-[15px] font-medium shadow-lg ring-1 ${TONOS[t.tono]}`}
          >
            {t.texto}
          </div>
        ))}
      </div>
    </ContextoTostadas.Provider>
  );
}

export function useAvisar() {
  return useContext(ContextoTostadas);
}
