import { useId, useState } from 'react';
import {
  ESTADOS_TORNEO_PUBLICOS,
  ETIQUETAS_ESTADO_TORNEO,
  type EstadoTorneoPublico,
} from '@shared/constants';
import { useConsulta } from '../../../common/hooks/useConsulta';
import { listarTorneos } from '../api';
import { TarjetaTorneo } from '../components/TarjetaTorneo';

/** UEB-Proyect-10 (KAN-23) · Ver todos los torneos. */
export function TorneosPage() {
  const idFiltro = useId();
  const [filtro, setFiltro] = useState<EstadoTorneoPublico | ''>('');
  const consulta = useConsulta((senal) => listarTorneos(filtro || undefined, senal), [filtro]);

  return (
    <section className="pagina">
      <header className="pagina__encabezado">
        <h1>Torneos</h1>
        <div className="campo">
          <label htmlFor={idFiltro}>Estado</label>
          <select
            id={idFiltro}
            value={filtro}
            onChange={(evento) => setFiltro(evento.target.value as EstadoTorneoPublico | '')}
          >
            <option value="">Todos</option>
            {ESTADOS_TORNEO_PUBLICOS.map((estado) => (
              <option key={estado} value={estado}>
                {ETIQUETAS_ESTADO_TORNEO[estado]}
              </option>
            ))}
          </select>
        </div>
      </header>

      {consulta.tipo === 'cargando' && <p role="status">Cargando torneos…</p>}

      {consulta.tipo === 'error' && (
        <p role="alert" className="aviso aviso--error">
          {consulta.mensaje}
        </p>
      )}

      {consulta.tipo === 'listo' &&
        (consulta.datos.length === 0 ? (
          <p className="aviso">Aún no hay torneos publicados. Vuelve pronto.</p>
        ) : (
          <ul className="lista-tarjetas">
            {consulta.datos.map((torneo) => (
              <li key={torneo.id}>
                <TarjetaTorneo torneo={torneo} />
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
