import { ETIQUETAS_ESTADO_TORNEO } from '@shared/constants';
import type { TorneoResumen } from '@shared/torneos';
import { formatearFecha } from '../../../common/lib/formato';

export function TarjetaTorneo({ torneo }: { torneo: TorneoResumen }) {
  return (
    <article className="tarjeta">
      <h2 className="tarjeta__titulo">{torneo.nombre}</h2>
      <a className="tarjeta__detalle" href={`/torneos/${torneo.id}`}>Ver detalle <span aria-hidden="true">→</span></a>
      <span className={`etiqueta etiqueta--${torneo.estado.toLowerCase()}`}>
        {ETIQUETAS_ESTADO_TORNEO[torneo.estado]}
      </span>
      <dl className="tarjeta__datos">
        <div>
          <dt>Inicio</dt>
          <dd>{formatearFecha(torneo.fechaInicio)}</dd>
        </div>
        <div>
          <dt>Cupo</dt>
          <dd>{torneo.cupo} equipos</dd>
        </div>
      </dl>
    </article>
  );
}
