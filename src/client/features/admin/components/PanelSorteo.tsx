import React, { useState } from 'react';
import { estimarFixture } from '../../../../shared/sorteo/contrato-sorteo';
import { REGLAS } from '../../../../shared/constants';
import { sorteoApi } from '../api/sorteo-api';
import { ModalConfirmarSorteo } from './ModalConfirmarSorteo';
import styles from './PanelSorteo.module.css';

export interface PanelSorteoProps {
  torneoId: string;
  equiposAprobados: number;
  solicitudesPendientes: number;
  bloqueado?: boolean;
  onSorteoCompletado: () => void;
  ejecutarSorteoFn?: (torneoId: string) => Promise<any>;
}

export const PanelSorteo: React.FC<PanelSorteoProps> = ({
  torneoId,
  equiposAprobados,
  solicitudesPendientes,
  bloqueado = false,
  onSorteoCompletado,
  ejecutarSorteoFn,
}) => {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimacion = estimarFixture(equiposAprobados);
  const puedeSortear = estimacion.valido && !bloqueado;

  const handleConfirmar = async () => {
    try {
      setCargando(true);
      setError(null);
      if (ejecutarSorteoFn) {
        await ejecutarSorteoFn(torneoId);
      } else {
        await sorteoApi.ejecutarSorteo(torneoId);
      }
      setModalAbierto(false);
      onSorteoCompletado();
    } catch (err: any) {
      setError(err?.message || 'Error al ejecutar el sorteo');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className={styles.panel} data-testid="panel-sorteo">
      <div className={styles.cabecera}>
        <h3 className={styles.titulo}>
          <span>⚽</span> Cerrar inscripciones y sortear
        </h3>
        <span className={styles.badgeEstado}>
          Vista previa del fixture
        </span>
      </div>

      {!estimacion.valido ? (
        <div className={styles.alertaInsuficientes} aria-live="polite">
          <span>⚠️</span>
          <span>
            Se necesitan al menos {REGLAS.EQUIPOS_POR_TORNEO_MIN} equipos aprobados para sortear (actualmente {equiposAprobados}).
          </span>
        </div>
      ) : (
        <div className={styles.cuerpo}>
          <div className={styles.cajaMetrica}>
            <span className={styles.etiquetaMetrica}>Equipos</span>
            <span className={`${styles.valorMetrica} ${styles.valorMetricaResaltado}`}>
              {equiposAprobados}
            </span>
          </div>
          <div className={styles.cajaMetrica}>
            <span className={styles.etiquetaMetrica}>Fechas</span>
            <span className={styles.valorMetrica}>{estimacion.totalFechas}</span>
          </div>
          <div className={styles.cajaMetrica}>
            <span className={styles.etiquetaMetrica}>Partidos / Fecha</span>
            <span className={styles.valorMetrica}>{estimacion.partidosPorFecha}</span>
          </div>
          <div className={styles.cajaMetrica}>
            <span className={styles.etiquetaMetrica}>Total Partidos</span>
            <span className={styles.valorMetrica}>{estimacion.totalPartidos}</span>
          </div>
          <div className={styles.cajaMetrica}>
            <span className={styles.etiquetaMetrica}>Descansos</span>
            <span className={styles.valorMetrica}>
              {estimacion.tieneDescanso ? '1 por fecha' : 'Ninguno (par)'}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.alertaInsuficientes} style={{ borderColor: '#ef4444', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      <div className={styles.pie}>
        <p className={styles.notaAviso}>
          {solicitudesPendientes > 0
            ? `⚠️ Hay ${solicitudesPendientes} solicitud(es) pendiente(s) que se rechazarán automáticamente.`
            : 'Todas las solicitudes han sido resueltas.'}
        </p>

        <button
          type="button"
          className={styles.botonSortear}
          disabled={!puedeSortear || cargando}
          onClick={() => setModalAbierto(true)}
        >
          <span>🎯</span> Cerrar inscripciones y sortear
        </button>
      </div>

      <ModalConfirmarSorteo
        abierto={modalAbierto}
        esRepeticion={false}
        equiposAprobados={equiposAprobados}
        solicitudesPendientes={solicitudesPendientes}
        cargando={cargando}
        onConfirmar={handleConfirmar}
        onCancelar={() => setModalAbierto(false)}
      />
    </div>
  );
};
