import type { ReactNode } from 'react';
import estilos from './Insignia.module.css';

/** Etiqueta pequeña en tinte neón, como «Jugador» en el menú y la barra lateral. */
export function Insignia({ children }: { children: ReactNode }) {
  return <span className={estilos.insignia}>{children}</span>;
}
