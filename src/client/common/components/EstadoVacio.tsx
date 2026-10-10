import { Icono, type NombreDeIcono } from './Icono';
import estilos from './EstadoVacio.module.css';

interface PropiedadesEstadoVacio {
  icono: NombreDeIcono;
  titulo: string;
  descripcion: string;
  /** punteado: caja con borde punteado (calendario) · liso: sin borde (dentro de una tarjeta). */
  borde?: 'punteado' | 'liso';
  /** En escritorio, centrado en columna (W04 · Mis torneos). */
  centradoEnEscritorio?: boolean;
}

/** Lo que se ve cuando todavía no hay datos: ícono en círculo, título y una línea de ayuda. */
export function EstadoVacio({
  icono,
  titulo,
  descripcion,
  borde = 'liso',
  centradoEnEscritorio = false,
}: PropiedadesEstadoVacio) {
  const clases = [
    estilos.estadoVacio,
    borde === 'punteado' && estilos.punteado,
    centradoEnEscritorio && estilos.centradoEnEscritorio,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={clases}>
      <span className={estilos.circulo}>
        <Icono nombre={icono} />
      </span>
      <span className={estilos.textos}>
        <span className={estilos.titulo}>{titulo}</span>
        <span className={estilos.descripcion}>{descripcion}</span>
      </span>
    </div>
  );
}
