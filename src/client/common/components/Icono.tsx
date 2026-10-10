/**
 * Íconos de trazo del diseño v3, dibujados en línea para que tomen el color del texto
 * (currentColor). Son decorativos: el texto o el aria-label del control los describe.
 */
const TRAZOS = {
  menu: <path d="M4 7h16M4 12h16M4 17h10" strokeWidth="2.2" />,
  cerrar: <path d="M6 6l12 12M18 6L6 18" strokeWidth="2.4" />,
  volver: <path d="M15 5l-7 7 7 7" strokeWidth="2.2" />,
  siguiente: <path d="M9 5l7 7-7 7" strokeWidth="2.4" />,
  confirmar: <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="3" />,
  copa: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8" />
    </>
  ),
  escudo: <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" />,
  calendario: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  perfil: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
    </>
  ),
  tabla: <path d="M5 19V11M12 19V5M19 19v-6" />,
  candado: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  ojo: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeWidth="2.2" />
    </>
  ),
  salir: (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 8l-4 4 4 4M6 12h10" />
    </>
  ),
} as const;

export type NombreDeIcono = keyof typeof TRAZOS;

interface PropiedadesIcono {
  nombre: NombreDeIcono;
  tamano?: number;
  className?: string;
}

export function Icono({ nombre, tamano = 20, className }: PropiedadesIcono) {
  return (
    <svg
      aria-hidden="true"
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
