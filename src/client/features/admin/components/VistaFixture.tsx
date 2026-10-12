import React, { useEffect, useState } from 'react';
import {
  ETIQUETAS_ESTADO_PARTIDO,
  FixtureTorneoResponse,
  PartidoFixtureResumen,
} from '../../../../shared/sorteo/contrato-sorteo';
import type { CanchaDisponibleSelector } from '../../../../shared/sedes/contrato-sedes';
import type { ProgramarPartidoDto } from '../../../../shared/partidos/contrato-partidos';
import { sedesApi } from '../api/sedes-api';
import { sorteoApi } from '../api/sorteo-api';
import { ModalConfirmarSorteo } from './ModalConfirmarSorteo';
import { ModalProgramarPartido } from './ModalProgramarPartido';
import styles from './VistaFixture.module.css';

export interface VistaFixtureProps {
  fixture: FixtureTorneoResponse;
  cargando?: boolean;
  onFixtureActualizado: () => void;
  repetirSorteoFn?: (torneoId: string) => Promise<unknown>;
  canchasDisponibles?: CanchaDisponibleSelector[];
  programarFn?: (partidoId: string, dto: ProgramarPartidoDto) => Promise<unknown>;
  desprogramarFn?: (partidoId: string) => Promise<unknown>;
}

function formatearFechaHoraPartido(fechaIso: string | null): string {
  if (!fechaIso) return '';
  try {
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return fechaIso;
  }
}

export const VistaFixture: React.FC<VistaFixtureProps> = ({
  fixture,
  cargando = false,
  onFixtureActualizado,
  repetirSorteoFn,
  canchasDisponibles: propCanchas,
  programarFn,
  desprogramarFn,
}) => {
  const [modalRepetirAbierto, setModalRepetirAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para programación de partidos (KAN-35)
  const [canchasCargadas, setCanchasCargadas] = useState<CanchaDisponibleSelector[]>([]);
  const canchas = propCanchas ?? canchasCargadas;
  const [partidoAProgramar, setPartidoAProgramar] = useState<PartidoFixtureResumen | null>(null);
  const [numeroFechaSeleccionada, setNumeroFechaSeleccionada] = useState<number | undefined>();

  useEffect(() => {
    if (!propCanchas) {
      sedesApi
        .obtenerCanchasDisponibles()
        .then(setCanchasCargadas)
        .catch(() => {});
    }
  }, [propCanchas]);

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

  const abrirModalProgramar = (partido: PartidoFixtureResumen, numeroFecha: number) => {
    setPartidoAProgramar(partido);
    setNumeroFechaSeleccionada(numeroFecha);
  };

  const cerrarModalProgramar = () => {
    setPartidoAProgramar(null);
    setNumeroFechaSeleccionada(undefined);
  };

  const handleProgramacionCompletada = () => {
    cerrarModalProgramar();
    onFixtureActualizado();
  };

  if (cargando) {
    return <div className={styles.cargando}>Cargando fixture del torneo…</div>;
  }

  return (
    <div className={styles.contenedor} data-testid="vista-fixture">
      <div className={styles.cabeceraFixture}>
        <div>
          <h3 className={styles.titulo}>
            Calendario y Fixture del Torneo
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
            Repetir sorteo
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
                <span>
                  Descansa: <strong>{fecha.equipoDescansa.nombre}</strong>
                </span>
              </div>
            )}

            <div className={styles.listaPartidos}>
              {fecha.partidos.map((partido) => {
                const esProgramado = partido.estado === 'PROGRAMADO';
                const puedeProgramar = partido.estado !== 'JUGADO' && partido.estado !== 'CANCELADO';

                const textoLugar = partido.sedeNombre
                  ? `${partido.sedeNombre} · ${partido.canchaNombre || partido.cancha}`
                  : partido.cancha;

                return (
                  <div key={partido.id} className={styles.tarjetaPartido} data-testid={`tarjeta-partido-${partido.id}`}>
                    <div className={styles.cuerpoPartido}>
                      <div className={styles.cabeceraPartido}>
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

                        <div className={styles.accionesPartido}>
                          <span
                            className={`${styles.badgeEstadoPartido} ${
                              partido.estado === 'POR_PROGRAMAR'
                                ? styles.badgePorProgramar
                                : partido.estado === 'PROGRAMADO'
                                  ? styles.badgeProgramado
                                  : ''
                            }`}
                          >
                            {ETIQUETAS_ESTADO_PARTIDO[partido.estado] || partido.estado}
                          </span>

                          {puedeProgramar && (
                            <button
                              type="button"
                              id={`btn-programar-partido-${partido.id}`}
                              data-testid={`btn-programar-partido-${partido.id}`}
                              className={esProgramado ? styles.botonReprogramar : styles.botonProgramar}
                              onClick={() => abrirModalProgramar(partido, fecha.numero)}
                            >
                              <span>{esProgramado ? 'Reprogramar' : 'Programar'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {esProgramado && (partido.fechaHora || textoLugar) && (
                        <div className={styles.detallesProgramacion} data-testid={`detalles-programacion-${partido.id}`}>
                          {textoLugar && (
                            <div className={styles.itemProgramacion}>
                              <span>{textoLugar}</span>
                            </div>
                          )}
                          {partido.fechaHora && (
                            <div className={styles.itemProgramacion}>
                              <span className={styles.iconoProgramacion}>⏰</span>
                              <span>{formatearFechaHoraPartido(partido.fechaHora)} (Duración: 2h)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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

      <ModalProgramarPartido
        estaAbierto={Boolean(partidoAProgramar)}
        partido={partidoAProgramar}
        numeroFecha={numeroFechaSeleccionada}
        canchasDisponibles={canchas}
        alCerrar={cerrarModalProgramar}
        alGuardado={handleProgramacionCompletada}
        programarFn={programarFn}
        desprogramarFn={desprogramarFn}
      />
    </div>
  );
};
