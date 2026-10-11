import React, { useState } from 'react';
import {
  ETIQUETAS_ESTADO_PARTIDO,
  FixtureTorneoResponse,
} from '../../../../shared/sorteo/contrato-sorteo';
import { sorteoApi } from '../api/sorteo-api';
import { ModalConfirmarSorteo } from './ModalConfirmarSorteo';
import styles from './VistaFixture.module.css';

export interface VistaFixtureProps {
  fixture: FixtureTorneoResponse;
  cargando?: boolean;
  onFixtureActualizado: () => void;
  repetirSorteoFn?: (torneoId: string) => Promise<unknown>;
}

export const VistaFixture: React.FC<VistaFixtureProps> = ({
  fixture,
  cargando = false,
  onFixtureActualizado,
  repetirSorteoFn,
}) => {
  const [modalRepetirAbierto, setModalRepetirAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmarRepeticion = async () => {
    try {
      setProcesando(true);
      setError(null);
      if (repetirSorteoFn) {
        await repetirSorteoFn(fixture.torneoId);
      } else {
        await sorteoApi.repetirSorteo(fixture.torneoId);
      }
      setModalRepetirAbierto(false);
      onFixtureActualizado();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al repetir el sorteo');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return <div className={styles.cargando}>Cargando fixture del torneo…</div>;
  }

  return (
    <div className={styles.contenedor} data-testid="vista-fixture">
      <div className={styles.cabeceraFixture}>
        <div>
          <h3 className={styles.titulo}>
            <span>📅</span> Calendario y Fixture del Torneo
          </h3>
          <div className={styles.resumenMetricas}>
            <span className={styles.metricaItem}>
              Fechas: <strong>{fixture.totalFechas}</strong>
            </span>
            <span className={styles.metricaItem}>
              Partidos: <strong>{fixture.totalPartidos}</strong>
            </span>
            <span className={styles.metricaItem}>
              Equipos: <strong>{fixture.totalEquipos}</strong>
            </span>
          </div>
        </div>

        {fixture.puedeRepetirSorteo && (
          <button
            type="button"
            className={styles.botonRepetir}
            onClick={() => setModalRepetirAbierto(true)}
            disabled={procesando}
          >
            <span>🔄</span> Repetir sorteo
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            color: '#fca5a5',
            background: 'rgba(239, 68, 68, 0.2)',
            padding: '0.75rem',
            borderRadius: '6px',
          }}
        >
          {error}
        </div>
      )}

      <div className={styles.grillaFechas}>
        {fixture.fechas.map((fecha) => (
          <div key={fecha.id} className={styles.tarjetaFecha}>
            <h4 className={styles.tituloFecha}>
              <span>Fecha {fecha.numero}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {fecha.partidos.length} partido{fecha.partidos.length !== 1 ? 's' : ''}
              </span>
            </h4>

            {fecha.equipoDescansa && (
              <div className={styles.cajaDescanso}>
                <span>💤</span>
                <span>
                  Descansa: <strong>{fecha.equipoDescansa.nombre}</strong>
                </span>
              </div>
            )}

            <div className={styles.listaPartidos}>
              {fecha.partidos.map((partido) => (
                <div key={partido.id} className={styles.tarjetaPartido}>
                  <div className={styles.enfrentamiento}>
                    <span className={styles.equipoLocal}>
                      {partido.local.color && (
                        <span
                          className={styles.puntoColor}
                          style={{ backgroundColor: partido.local.color }}
                        />
                      )}
                      <span>{partido.local.nombre}</span>
                    </span>

                    <span className={styles.versus}>vs</span>

                    <span className={styles.equipoVisitante}>
                      {partido.visitante.color && (
                        <span
                          className={styles.puntoColor}
                          style={{ backgroundColor: partido.visitante.color }}
                        />
                      )}
                      <span>{partido.visitante.nombre}</span>
                    </span>
                  </div>

                  <span
                    className={`${styles.badgeEstadoPartido} ${
                      partido.estado === 'POR_PROGRAMAR' ? styles.badgePorProgramar : ''
                    }`}
                  >
                    {ETIQUETAS_ESTADO_PARTIDO[partido.estado] || partido.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ModalConfirmarSorteo
        abierto={modalRepetirAbierto}
        esRepeticion={true}
        equiposAprobados={fixture.totalEquipos}
        cargando={procesando}
        onConfirmar={handleConfirmarRepeticion}
        onCancelar={() => setModalRepetirAbierto(false)}
      />
    </div>
  );
};
