import type { ReactNode } from 'react';
import estilos from './EncabezadoDeSeccion.module.css';

interface PropiedadesEncabezadoDeSeccion {
  /** Id del h2: la sección lo usa en aria-labelledby. */
  id: string;
  titulo: string;
  /** Texto o control a la derecha del título: un rango de fechas, un progreso, filtros… */
  complemento?: ReactNode;
  tamano?: 'normal' | 'grande';
}

/** Título de una sección (h2) con un complemento alineado a la derecha. */
export function EncabezadoDeSeccion({
  id,
  titulo,
  complemento,
  tamano = 'normal',
}: PropiedadesEncabezadoDeSeccion) {
  return (
    <div className={estilos.encabezado}>
      <h2 id={id} className={tamano === 'grande' ? estilos.tituloGrande : estilos.titulo}>
        {titulo}
      </h2>
      {complemento}
    </div>
  );
}
