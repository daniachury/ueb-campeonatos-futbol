import { Link } from 'react-router';
import { Icono, type NombreDeIcono } from './Icono';
import estilos from './BotonIcono.module.css';

interface PropiedadesComunes {
  icono: NombreDeIcono;
  /** Obligatorio: es lo único que describe el control a un lector de pantalla. */
  etiqueta: string;
  /** campo: sobre blanco (volver) · blanco: sobre gris o neón (menú, cerrar) · transparente: sobre grafito. */
  fondo?: 'campo' | 'blanco' | 'transparente';
  tamano?: 44 | 46;
}

type PropiedadesBotonIcono = PropiedadesComunes &
  ({ ruta: string; alPulsar?: () => void } | { ruta?: undefined; alPulsar: () => void });

/** Botón redondo con solo un ícono. Con `ruta` es un enlace; sin ella, un botón. */
export function BotonIcono({
  icono,
  etiqueta,
  fondo = 'blanco',
  tamano = 44,
  ruta,
  alPulsar,
}: PropiedadesBotonIcono) {
  const clases = `${estilos.botonIcono} ${estilos[fondo]} ${estilos[`tamano${tamano}`]}`;
  const tamanoDelIcono = icono === 'cerrar' || icono === 'volver' ? 20 : 22;

  if (ruta !== undefined) {
    return (
      <Link to={ruta} aria-label={etiqueta} className={clases} onClick={alPulsar}>
        <Icono nombre={icono} tamano={tamanoDelIcono} />
      </Link>
    );
  }
  return (
    <button type="button" aria-label={etiqueta} className={clases} onClick={alPulsar}>
      <Icono nombre={icono} tamano={tamanoDelIcono} />
    </button>
  );
}
