import { useEffect, useState } from 'react';
import { Boton } from '../../../common/components/Boton';
import type { TorneoAdminResumen } from '../../../../shared/torneos';
import { torneosAdminApi } from '../api/torneos-api';
import estilos from './ModalCrearTorneo.module.css';

export interface ModalEliminarTorneoProps {
  estaAbierto: boolean;
  torneo: TorneoAdminResumen | null;
  alCerrar: () => void;
  alEliminado: (id: string, tipo: 'DEFINITIVA' | 'LOGICA') => void;
  eliminarFn?: (
    id: string,
    confirmacion: string,
  ) => Promise<{ tipo: 'DEFINITIVA' | 'LOGICA'; mensaje: string }>;
  obtenerImpactoFn?: (
    id: string,
  ) => Promise<{ equiposInscritos: number; partidos: number; resultados: number }>;
}

export function ModalEliminarTorneo({
  estaAbierto,
  torneo,
  alCerrar,
  alEliminado,
  eliminarFn,
  obtenerImpactoFn,
}: ModalEliminarTorneoProps) {
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [impacto, setImpacto] = useState<{
    equiposInscritos: number;
    partidos: number;
    resultados: number;
  } | null>(null);
  const [cargandoImpacto, setCargandoImpacto] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [estabaAbierto, setEstabaAbierto] = useState(estaAbierto);
  const [torneoAnterior, setTorneoAnterior] = useState(torneo);

  if (estaAbierto !== estabaAbierto || torneo !== torneoAnterior) {
    setEstabaAbierto(estaAbierto);
    setTorneoAnterior(torneo);
    if (estaAbierto && torneo) {
      setTextoConfirmacion('');
      setError(null);
      setImpacto(null);
      setCargandoImpacto(true);
    }
  }

  useEffect(() => {
    if (estaAbierto && torneo) {
      let cancelado = false;
      const fn = obtenerImpactoFn ?? torneosAdminApi.obtenerImpactoEliminacion;
      fn(torneo.id)
        .then((res) => {
          if (!cancelado) setImpacto(res);
        })
        .catch(() => {
          if (!cancelado) {
            setImpacto({
              equiposInscritos: 0,
              partidos: 0,
              resultados: 0,
            });
          }
        })
        .finally(() => {
          if (!cancelado) setCargandoImpacto(false);
        });
      return () => {
        cancelado = true;
      };
    }
  }, [estaAbierto, torneo, obtenerImpactoFn]);

  if (!estaAbierto || !torneo) return null;

  const coincideExacto = textoConfirmacion.trim() === torneo.nombre;
  const tieneResultados = (impacto?.resultados ?? 0) > 0;

  async function manejarEliminacion() {
    if (!coincideExacto || !torneo) return;
    setEliminando(true);
    setError(null);

    try {
      const fn = eliminarFn ?? torneosAdminApi.eliminar;
      const res = await fn(torneo.id, textoConfirmacion.trim());
      alEliminado(torneo.id, res.tipo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar el torneo';
      setError(msg);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div
      className={estilos.fondo}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-eliminar-torneo"
    >
      <div className={estilos.tarjeta}>
        <div className={estilos.cabecera}>
          <h2 id="titulo-modal-eliminar-torneo" className={estilos.titulo}>
            Eliminar torneo
          </h2>
          <button
            type="button"
            className={estilos.cerrar}
            onClick={alCerrar}
            aria-label="Cerrar modal"
            disabled={eliminando}
          >
            ×
          </button>
        </div>

        <div className={estilos.formulario}>
          {error && (
            <div className={estilos.alertaError} role="alert">
              {error}
            </div>
          )}

          <p className={estilos.descripcion}>
            ¿Estás seguro de que deseas eliminar el torneo <strong>«{torneo.nombre}»</strong>?
          </p>

          {cargandoImpacto ? (
            <p role="status">Calculando impacto...</p>
          ) : (
            impacto && (
              <div
                className={estilos.campoFijo}
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}
                data-testid="impacto-eliminacion"
              >
                <span>
                  <strong>Impacto:</strong> {impacto.equiposInscritos} equipos inscritos,{' '}
                  {impacto.partidos} partidos, {impacto.resultados} resultados.
                </span>
                {tieneResultados ? (
                  <span style={{ color: '#fbbf24', fontSize: '0.85rem' }}>
                    ⚠️ Al tener resultados registrados, el torneo pasará a estado{' '}
                    <strong>CANCELADO</strong> para conservar el histórico.
                  </span>
                ) : (
                  <span style={{ color: '#f87171', fontSize: '0.85rem' }}>
                    Esta acción es irreversible y eliminará definitivamente el torneo y sus registros.
                  </span>
                )}
              </div>
            )
          )}

          <div className={estilos.grupo}>
            <label htmlFor="confirmar-nombre-torneo" className={estilos.etiqueta}>
              Escribe exactamente <strong>{torneo.nombre}</strong> para confirmar:
            </label>
            <input
              id="confirmar-nombre-torneo"
              type="text"
              className={estilos.input}
              value={textoConfirmacion}
              onChange={(e) => setTextoConfirmacion(e.target.value)}
              placeholder={torneo.nombre}
              disabled={eliminando}
              autoComplete="off"
            />
          </div>

          <div className={estilos.acciones}>
            <Boton
              id="btn-cancelar-eliminar-torneo"
              tipo="button"
              variante="secundario"
              alPulsar={alCerrar}
              estaDeshabilitado={eliminando}
            >
              Cancelar
            </Boton>
            <Boton
              id="btn-confirmar-eliminar-torneo"
              tipo="button"
              variante="principal"
              estaCargando={eliminando}
              estaDeshabilitado={!coincideExacto || eliminando}
              alPulsar={manejarEliminacion}
            >
              {tieneResultados ? 'Cancelar torneo' : 'Eliminar definitivamente'}
            </Boton>
          </div>
        </div>
      </div>
    </div>
  );
}
