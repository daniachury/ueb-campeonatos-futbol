import type { ReactNode } from 'react';
import estilos from './Aviso.module.css';

interface PropiedadesAviso {
  children: ReactNode;
  /** error: rojo suave, se anuncia de inmediato · informativo: tinte neón, se anuncia sin interrumpir. */
  tono: 'error' | 'informativo';
}

/** Mensaje en caja redondeada dentro de un formulario (v3 · M01, M02 y W03). */
export function Aviso({ children, tono }: PropiedadesAviso) {
  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      className={`${estilos.aviso} ${estilos[tono]}`}
    >
      {children}
    </div>
  );
}
