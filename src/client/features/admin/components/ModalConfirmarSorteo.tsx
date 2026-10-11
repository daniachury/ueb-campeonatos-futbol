import React, { useEffect, useRef } from 'react';
import styles from './ModalConfirmarSorteo.module.css';

export interface ModalConfirmarSorteoProps {
  abierto: boolean;
  esRepeticion?: boolean;
  equiposAprobados: number;
  solicitudesPendientes?: number;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ModalConfirmarSorteo: React.FC<ModalConfirmarSorteoProps> = ({
  abierto,
  esRepeticion = false,
  equiposAprobados,
  solicitudesPendientes = 0,
  cargando = false,
  onConfirmar,
  onCancelar,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !cargando) {
        onCancelar();
      }
    };

    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, cargando, onCancelar]);

  if (!abierto) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && !cargando) {
          onCancelar();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-sorteo-titulo"
    >
      <div className={styles.modal} ref={modalRef}>
        <h3
          id="modal-sorteo-titulo"
          className={`${styles.titulo} ${esRepeticion ? styles.tituloRepetir : ''}`}
        >
          {esRepeticion ? '🔄 Repetir sorteo del torneo' : '⚽ Cerrar inscripciones y sortear'}
        </h3>

        <div className={styles.contenido}>
          {esRepeticion ? (
            <>
              <p>
                Se regenerará todo el fixture todos contra todos con un{' '}
                <strong>orden aleatorio diferente</strong> para los {equiposAprobados} equipos
                aprobados.
              </p>
              <div className={styles.infoDetalle}>
                ⚠️ Se reemplazarán las fechas y partidos actuales. Esta acción solo es posible
                porque aún no hay ningún resultado registrado.
              </div>
            </>
          ) : (
            <>
              <p>
                Se generará el fixture todos contra todos para{' '}
                <strong>{equiposAprobados} equipos aprobados</strong> y el torneo pasará a estado{' '}
                <strong>En curso</strong>.
              </p>

              {solicitudesPendientes > 0 && (
                <div className={styles.alertaPendientes}>
                  <span>⚠️</span>
                  <span>
                    Hay{' '}
                    <strong>
                      {solicitudesPendientes === 1
                        ? '1 solicitud pendiente'
                        : `${solicitudesPendientes} solicitudes pendientes`}
                    </strong>
                    . Al proceder, serán <strong>rechazadas automáticamente</strong> con el motivo:{' '}
                    <em>«Inscripciones cerradas»</em>.
                  </span>
                </div>
              )}

              <div className={styles.infoDetalle}>
                ℹ️ Una vez iniciado el torneo, no se podrán aprobar nuevas inscripciones ni
                modificar los equipos del fixture.
              </div>
            </>
          )}
        </div>

        <div className={styles.acciones}>
          <button
            type="button"
            className={styles.botonCancelar}
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`${styles.botonConfirmar} ${esRepeticion ? styles.botonConfirmarRepetir : ''}`}
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando
              ? 'Procesando…'
              : esRepeticion
                ? 'Confirmar y repetir sorteo'
                : 'Confirmar y sortear'}
          </button>
        </div>
      </div>
    </div>
  );
};
