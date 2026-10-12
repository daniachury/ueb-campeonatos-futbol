import { useState } from 'react';
import { Boton } from '../../../common/components/Boton';
import type {
  RespuestaAbrirInscripciones,
  TorneoAdminResumen,
} from '../../../../shared/torneos';
import { torneosAdminApi } from '../api/torneos-api';
import estilos from './ModalConfirmarApertura.module.css';

export interface ModalConfirmarAperturaProps {
  estaAbierto: boolean;
  torneo: TorneoAdminResumen | null;
  alCerrar: () => void;
  alConfirmado: (torneoActualizado: TorneoAdminResumen) => void;
  abrirFn?: (id: string) => Promise<RespuestaAbrirInscripciones>;
}

export function ModalConfirmarApertura({
  estaAbierto,
  torneo,
  alCerrar,
  alConfirmado,
  abrirFn,
}: ModalConfirmarAperturaProps) {
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!estaAbierto || !torneo) return null;

  async function confirmar() {
    if (!torneo) return;
    setProcesando(true);
    setError(null);

    try {
      const ejecutarAbrir = abrirFn ?? torneosAdminApi.abrirInscripciones;
      const res = await ejecutarAbrir(torneo.id);
      alConfirmado(res.torneo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al abrir las inscripciones';
      setError(msg);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div
      className={estilos.fondo}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-confirmar-apertura"
    >
      <div className={estilos.tarjeta}>
        <div className={estilos.cabecera}>
          <h2 id="titulo-modal-confirmar-apertura" className={estilos.titulo}>
            Abrir inscripciones
          </h2>
        </div>

        <p className={estilos.mensaje}>
          ¿Estás seguro de abrir las inscripciones para el torneo{' '}
          <strong>«{torneo.nombre}»</strong>?
        </p>

        <div className={estilos.advertencia}>
          <span>
            Esta acción es <strong>irreversible</strong>: el torneo pasará al estado de
            inscripciones abiertas y será visible de inmediato para todos los jugadores y equipos.
          </span>
        </div>

        {error && (
          <div className={estilos.error} role="alert">
            {error}
          </div>
        )}

        <div className={estilos.acciones}>
          <Boton
            tipo="button"
            variante="secundario"
            tamano="mediano"
            anchoCompleto={false}
            alPulsar={alCerrar}
            estaDeshabilitado={procesando}
          >
            Cancelar
          </Boton>
          <Boton
            id="btn-confirmar-apertura-modal"
            tipo="button"
            variante="principal"
            tamano="mediano"
            anchoCompleto={false}
            alPulsar={confirmar}
            estaDeshabilitado={procesando}
            estaCargando={procesando}
          >
            {procesando ? 'Abriendo…' : 'Sí, abrir inscripciones'}
          </Boton>
        </div>
      </div>
    </div>
  );
}
