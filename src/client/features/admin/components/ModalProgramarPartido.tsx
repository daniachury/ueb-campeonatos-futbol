import { useState, type FormEvent } from 'react';
import { Boton } from '../../../common/components/Boton';
import type { CanchaDisponibleSelector } from '../../../../shared/sedes/contrato-sedes';
import type { PartidoFixtureResumen } from '../../../../shared/sorteo/contrato-sorteo';
import type { ProgramarPartidoDto } from '../../../../shared/partidos/contrato-partidos';
import { partidosApi } from '../api/partidos-api';
import estilos from './ModalProgramarPartido.module.css';

export interface ModalProgramarPartidoProps {
  estaAbierto: boolean;
  partido: PartidoFixtureResumen | null;
  numeroFecha?: number;
  canchasDisponibles: CanchaDisponibleSelector[];
  alCerrar: () => void;
  alGuardado: () => void;
  programarFn?: (partidoId: string, dto: ProgramarPartidoDto) => Promise<unknown>;
  desprogramarFn?: (partidoId: string) => Promise<unknown>;
}

function fechaAValorInput(fechaIso: string | null | undefined): string {
  if (!fechaIso) return '';
  try {
    const d = new Date(fechaIso);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch {
    return '';
  }
}

export function ModalProgramarPartido({
  estaAbierto,
  partido,
  numeroFecha,
  canchasDisponibles,
  alCerrar,
  alGuardado,
  programarFn,
  desprogramarFn,
}: ModalProgramarPartidoProps) {
  const [canchaId, setCanchaId] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [desprogramando, setDesprogramando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [estabaAbierto, setEstabaAbierto] = useState(estaAbierto);
  const [partidoAnterior, setPartidoAnterior] = useState(partido);

  if (estaAbierto !== estabaAbierto || partido !== partidoAnterior) {
    setEstabaAbierto(estaAbierto);
    setPartidoAnterior(partido);
    if (estaAbierto && partido) {
      setCanchaId(partido.canchaId ?? '');
      setFechaHora(fechaAValorInput(partido.fechaHora));
      setError(null);
    }
  }

  if (!estaAbierto || !partido) return null;

  const esReprogramacion = partido.estado === 'PROGRAMADO';

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!partido) return;

    setError(null);

    if (!canchaId) {
      setError('Por favor selecciona una cancha deportiva');
      return;
    }

    if (!fechaHora) {
      setError('Por favor selecciona la fecha y hora del partido');
      return;
    }

    const fechaParsed = new Date(fechaHora);
    if (isNaN(fechaParsed.getTime())) {
      setError('La fecha y hora seleccionada no es válida');
      return;
    }

    try {
      setGuardando(true);
      const dto: ProgramarPartidoDto = {
        canchaId,
        fechaHora: fechaParsed.toISOString(),
      };

      if (programarFn) {
        await programarFn(partido.id, dto);
      } else {
        await partidosApi.programar(partido.id, dto);
      }

      alGuardado();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al programar el partido');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarDesprogramar() {
    if (!partido) return;
    setError(null);

    try {
      setDesprogramando(true);
      if (desprogramarFn) {
        await desprogramarFn(partido.id);
      } else {
        await partidosApi.desprogramar(partido.id);
      }
      alGuardado();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al desprogramar el partido');
    } finally {
      setDesprogramando(false);
    }
  }

  // Agrupar canchas por sede para el <select>
  const sedesMap = new Map<string, { sedeNombre: string; canchas: CanchaDisponibleSelector[] }>();
  for (const c of canchasDisponibles) {
    const item = sedesMap.get(c.sedeId) || { sedeNombre: c.sedeNombre, canchas: [] };
    item.canchas.push(c);
    sedesMap.set(c.sedeId, item);
  }

  return (
    <div
      className={estilos.fondo}
      role="dialog"
      aria-modal="true"
      data-testid="modal-programar-partido"
    >
      <div className={estilos.tarjeta}>
        <div className={estilos.cabecera}>
          <div>
            <h2 className={estilos.titulo}>
              {esReprogramacion ? 'Reprogramar partido' : 'Programar partido'}
            </h2>
            {numeroFecha !== undefined && (
              <p className={estilos.subtitulo}>Fecha {numeroFecha} · Fixture</p>
            )}
          </div>
        </div>

        <div className={estilos.cajaEnfrentamiento}>
          <div className={estilos.equipo}>
            {partido.local.color && (
              <span
                className={estilos.puntoColor}
                style={{ backgroundColor: partido.local.color }}
              />
            )}
            <span>{partido.local.nombre}</span>
          </div>

          <span className={estilos.versus}>VS</span>

          <div className={estilos.equipo}>
            {partido.visitante.color && (
              <span
                className={estilos.puntoColor}
                style={{ backgroundColor: partido.visitante.color }}
              />
            )}
            <span>{partido.visitante.nombre}</span>
          </div>
        </div>

        {error && (
          <div
            id="alerta-conflicto-horario"
            className={estilos.alertaConflicto}
            data-testid="alerta-conflicto-horario"
          >
            <span className={estilos.iconoAlerta}>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={manejarSubmit} className={estilos.formulario}>
          <div className={estilos.grupoCampo}>
            <label htmlFor="select-cancha-partido" className={estilos.etiqueta}>
              Lugar y cancha *
            </label>
            <select
              id="select-cancha-partido"
              data-testid="select-cancha-partido"
              className={estilos.campo}
              value={canchaId}
              onChange={(e) => setCanchaId(e.target.value)}
              required
            >
              <option value="">-- Selecciona una cancha --</option>
              {Array.from(sedesMap.values()).map((sede) => (
                <optgroup key={sede.sedeNombre} label={`📍 ${sede.sedeNombre}`}>
                  {sede.canchas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.superficie ? `(${c.superficie})` : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {canchasDisponibles.length === 0 && (
              <span className={estilos.pista}>
                No hay canchas registradas activas. Puedes crearlas en Sedes y Canchas.
              </span>
            )}
          </div>

          <div className={estilos.grupoCampo}>
            <label htmlFor="input-fecha-hora-partido" className={estilos.etiqueta}>
              Fecha y hora de inicio *
            </label>
            <input
              id="input-fecha-hora-partido"
              data-testid="input-fecha-hora-partido"
              type="datetime-local"
              className={estilos.campo}
              value={fechaHora}
              onChange={(e) => setFechaHora(e.target.value)}
              required
            />
            <span className={estilos.pista}>
              Cada partido tiene una duración reservada de 120 minutos (2 horas).
            </span>
          </div>

          <div className={estilos.acciones}>
            <div className={estilos.accionesPrincipales}>
              <Boton
                id="btn-cancelar-programacion"
                variante="secundario"
                tamano="mediano"
                anchoCompleto={false}
                estaDeshabilitado={guardando || desprogramando}
                alPulsar={alCerrar}
              >
                Cancelar
              </Boton>

              <Boton
                id="btn-guardar-programacion"
                tipo="submit"
                variante="principal"
                tamano="mediano"
                anchoCompleto={false}
                estaDeshabilitado={guardando || desprogramando || canchasDisponibles.length === 0}
              >
                {guardando ? 'Guardando…' : esReprogramacion ? 'Guardar cambios' : 'Programar partido'}
              </Boton>
            </div>

            {esReprogramacion && (
              <button
                type="button"
                id="btn-desprogramar-partido"
                data-testid="btn-desprogramar-partido"
                className={estilos.botonDesprogramar}
                disabled={guardando || desprogramando}
                onClick={manejarDesprogramar}
              >
                <span>✕</span> {desprogramando ? 'Desprogramando…' : 'Desprogramar partido'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
