import { obtenerIniciales } from '../lib/texto';
import estilos from './Avatar.module.css';

interface PropiedadesAvatar {
  nombreCompleto: string;
  /** Lado en píxeles: 40 (barra lateral), 46 (encabezado móvil), 52 (escritorio y menú). */
  tamano?: 40 | 46 | 52;
  /** grafito: inicio y menú del jugador · naranja: tarjeta de sesión activa (S01). */
  tono?: 'grafito' | 'naranja';
}

/** Círculo con las iniciales. Es decorativo: el nombre siempre está escrito al lado. */
export function Avatar({ nombreCompleto, tamano = 52, tono = 'grafito' }: PropiedadesAvatar) {
  return (
    <span
      aria-hidden="true"
      className={`${estilos.avatar} ${estilos[tono]} ${estilos[`tamano${tamano}`]}`}
    >
      {obtenerIniciales(nombreCompleto)}
    </span>
  );
}
