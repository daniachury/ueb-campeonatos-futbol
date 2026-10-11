import type { ReactNode } from 'react';
import { Link } from 'react-router';
import estilos from './Boton.module.css';

/**
 * principal: grafito con texto blanco (la acción principal de cada pantalla).
 * secundario: gris campo (S01 «Soy nuevo · Crear cuenta»).
 * blanco: sobre fondo neón (M11 «Crear mi equipo»).
 */
type VarianteDeBoton = 'principal' | 'secundario' | 'blanco';

/** grande: 56 px, formularios y acceso · mediano: 50 px, acciones dentro de tarjetas. */
type TamanoDeBoton = 'grande' | 'mediano';

function clasesDelBoton(variante: VarianteDeBoton, tamano: TamanoDeBoton, anchoCompleto: boolean) {
  return [estilos.boton, estilos[variante], estilos[tamano], anchoCompleto && estilos.anchoCompleto]
    .filter(Boolean)
    .join(' ');
}

interface PropiedadesBoton {
  children: ReactNode;
  tipo?: 'button' | 'submit';
  variante?: VarianteDeBoton;
  tamano?: TamanoDeBoton;
  anchoCompleto?: boolean;
  estaDeshabilitado?: boolean;
  estaCargando?: boolean;
  idDeLaAyuda?: string | undefined;
  testId?: string | undefined;
  'data-testid'?: string | undefined;
  alPulsar?: () => void;
}

/** Botón en forma de píldora. */
export function Boton({
  children,
  tipo = 'button',
  variante = 'principal',
  tamano = 'grande',
  anchoCompleto = true,
  estaDeshabilitado = false,
  estaCargando = false,
  idDeLaAyuda,
  testId,
  'data-testid': dataTestId,
  alPulsar,
}: PropiedadesBoton) {
  return (
    <button
      type={tipo}
      className={clasesDelBoton(variante, tamano, anchoCompleto)}
      disabled={estaDeshabilitado || estaCargando}
      aria-busy={estaCargando}
      aria-describedby={idDeLaAyuda}
      data-testid={dataTestId ?? testId}
      onClick={alPulsar}
    >
      {children}
    </button>
  );
}

interface PropiedadesEnlaceBoton {
  children: ReactNode;
  ruta: string;
  variante?: VarianteDeBoton;
  tamano?: TamanoDeBoton;
  anchoCompleto?: boolean;
  alPulsar?: () => void;
}

/** Enlace con forma de botón: navega a otra pantalla (v3 usa <a> para estas acciones). */
export function EnlaceBoton({
  children,
  ruta,
  variante = 'principal',
  tamano = 'grande',
  anchoCompleto = true,
  alPulsar,
}: PropiedadesEnlaceBoton) {
  return (
    <Link to={ruta} className={clasesDelBoton(variante, tamano, anchoCompleto)} onClick={alPulsar}>
      {children}
    </Link>
  );
}
