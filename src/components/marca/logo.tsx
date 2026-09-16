export function Isotipo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#3524A8" />
      <path
        d="M28.6 15.2a4.4 4.4 0 1 1 5.6 4.3c-1.3.4-2.2 1.5-2.2 2.9v2.4"
        fill="none"
        stroke="#F6F5FB"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 32.5 32 24.8l20.5 7.7"
        fill="none"
        stroke="#F6F5FB"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 26.5v24" fill="none" stroke="#F6F5FB" strokeWidth="5" strokeLinecap="round" />
      <g transform="rotate(12 46 42)">
        <rect x="40.5" y="35.5" width="11" height="15" rx="2" fill="#F4DC6B" />
        <circle cx="46" cy="39.2" r="1.5" fill="#3524A8" />
      </g>
    </svg>
  );
}

/** `compacto`: en pantallas de menos de 360 px queda solo el isotipo (encabezados apretados). */
export function Logo({ className = "", compacto = false }: { className?: string; compacto?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Isotipo />
      <span
        className={`titulo-ancho text-[19px] leading-none text-noche ${compacto ? "max-[359px]:hidden" : ""}`}
      >
        Tintora
        <span className="ml-1.5 inline-block rounded-md bg-dia-3 px-1.5 py-0.5 align-[2px] text-[11px] tracking-wider text-noche">
          POS
        </span>
      </span>
    </span>
  );
}
