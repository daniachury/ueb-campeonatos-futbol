import { useState, type FormEvent } from 'react';
import { Boton } from '../../../common/components/Boton';
import {
  obtenerFechaHoyBogota,
  type EditarTorneoDto,
  type TorneoAdminResumen,
} from '../../../../shared/torneos';
import { torneosAdminApi } from '../api/torneos-api';
import estilos from './ModalCrearTorneo.module.css';

export interface ModalEditarTorneoProps {
  estaAbierto: boolean;
  torneo: TorneoAdminResumen | null;
  alCerrar: () => void;
  alEditado: (torneo: TorneoAdminResumen) => void;
  editarFn?: (
    id: string,
    dto: EditarTorneoDto,
  ) => Promise<{ mensaje: string; torneo: TorneoAdminResumen }>;
}

export function ModalEditarTorneo({
  estaAbierto,
  torneo,
  alCerrar,
  alEditado,
  editarFn,
}: ModalEditarTorneoProps) {
  const hoy = obtenerFechaHoyBogota();
  const [nombre, setNombre] = useState(torneo?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(torneo?.descripcion ?? '');
  const [fechaInicio, setFechaInicio] = useState(torneo?.fechaInicio ?? hoy);
  const [cupo, setCupo] = useState<number | ''>(torneo?.cupo ?? 8);
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorFecha, setErrorFecha] = useState<string | null>(null);
  const [errorCupo, setErrorCupo] = useState<string | null>(null);

  const [torneoAnterior, setTorneoAnterior] = useState(torneo);

  if (torneo !== torneoAnterior) {
    setTorneoAnterior(torneo);
    if (torneo) {
      setNombre(torneo.nombre);
      setDescripcion(torneo.descripcion ?? '');
      setFechaInicio(torneo.fechaInicio);
      setCupo(torneo.cupo);
      setErrorGeneral(null);
      setErrorNombre(null);
      setErrorFecha(null);
      setErrorCupo(null);
    }
  }

  if (!estaAbierto || !torneo) return null;

  const esEnCurso = torneo.estado === 'EN_CURSO';

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    if (!torneo) return;

    setErrorGeneral(null);
    setErrorNombre(null);
    setErrorFecha(null);
    setErrorCupo(null);

    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 3 || nombreLimpio.length > 80) {
      setErrorNombre('El nombre debe tener entre 3 y 80 caracteres');
      return;
    }

    if (!esEnCurso) {
      if (!fechaInicio || fechaInicio < hoy) {
        setErrorFecha('La fecha de inicio no puede ser anterior a hoy');
        return;
      }

      const cupoNum = typeof cupo === 'number' ? cupo : Number(cupo);
      if (isNaN(cupoNum) || cupoNum < 3 || cupoNum > 20) {
        setErrorCupo('El cupo debe estar entre 3 y 20 equipos');
        return;
      }
    }

    setGuardando(true);

    try {
      const dto: EditarTorneoDto = {
        nombre: nombreLimpio,
        descripcion: descripcion.trim() || undefined,
        ...(!esEnCurso
          ? {
              fechaInicio,
              cupo: typeof cupo === 'number' ? cupo : Number(cupo),
            }
          : {}),
      };

      const ejecutarEditar = editarFn ?? torneosAdminApi.editar;
      const respuesta = await ejecutarEditar(torneo.id, dto);
      alEditado(respuesta.torneo);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al editar el torneo';
      setErrorGeneral(mensaje);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className={estilos.fondo}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-editar-torneo"
    >
      <div className={estilos.tarjeta}>
        <div className={estilos.cabecera}>
          <h2 id="titulo-modal-editar-torneo" className={estilos.titulo}>
            Editar torneo
          </h2>
          <button
            type="button"
            className={estilos.cerrar}
            onClick={alCerrar}
            aria-label="Cerrar modal"
            disabled={guardando}
          >
            ×
          </button>
        </div>

        <form onSubmit={manejarEnvio} noValidate className={estilos.formulario}>
          {errorGeneral && (
            <div className={estilos.alertaError} role="alert">
              {errorGeneral}
            </div>
          )}

          {/* Nombre */}
          <div className={estilos.grupo}>
            <label htmlFor="nombre-torneo-editar" className={estilos.etiqueta}>
              Nombre del torneo <span className={estilos.obligatorio}>*</span>
            </label>
            <input
              id="nombre-torneo-editar"
              type="text"
              className={estilos.input}
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errorNombre) setErrorNombre(null);
                if (errorGeneral) setErrorGeneral(null);
              }}
              required
              minLength={3}
              maxLength={80}
              disabled={guardando}
            />
            {errorNombre && <span className={estilos.errorTexto}>{errorNombre}</span>}
            <span className={estilos.ayuda}>Entre 3 y 80 caracteres. Único en el sistema.</span>
          </div>

          {/* Descripción */}
          <div className={estilos.grupo}>
            <label htmlFor="descripcion-torneo-editar" className={estilos.etiqueta}>
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion-torneo-editar"
              className={estilos.textarea}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={500}
              disabled={guardando}
            />
            <span className={estilos.ayuda}>Máximo 500 caracteres.</span>
          </div>

          {/* Fecha de inicio y Cupo */}
          <div className={estilos.filaDoble}>
            <div className={estilos.grupo}>
              <label htmlFor="fecha-inicio-torneo-editar" className={estilos.etiqueta}>
                Fecha de inicio <span className={estilos.obligatorio}>*</span>
              </label>
              <input
                id="fecha-inicio-torneo-editar"
                type="date"
                min={hoy}
                className={estilos.input}
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  if (errorFecha) setErrorFecha(null);
                }}
                required
                disabled={guardando || esEnCurso}
              />
              {esEnCurso && (
                <span className={estilos.ayuda}>No editable después del sorteo</span>
              )}
              {errorFecha && <span className={estilos.errorTexto}>{errorFecha}</span>}
            </div>

            <div className={estilos.grupo}>
              <label htmlFor="cupo-torneo-editar" className={estilos.etiqueta}>
                Cupo máximo <span className={estilos.obligatorio}>*</span>
              </label>
              <input
                id="cupo-torneo-editar"
                type="number"
                min={3}
                max={20}
                className={estilos.input}
                value={cupo}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setCupo(val);
                  if (errorCupo) setErrorCupo(null);
                }}
                required
                disabled={guardando || esEnCurso}
              />
              {esEnCurso && (
                <span className={estilos.ayuda}>No editable después del sorteo</span>
              )}
              {errorCupo && <span className={estilos.errorTexto}>{errorCupo}</span>}
              {!esEnCurso && (
                <span className={estilos.ayuda}>
                  {torneo.estado === 'INSCRIPCIONES_ABIERTAS'
                    ? 'No menor a los equipos ya aprobados.'
                    : 'Entre 3 y 20 equipos.'}
                </span>
              )}
            </div>
          </div>

          {/* Modalidad y Formato */}
          <div className={estilos.filaDoble}>
            <div className={estilos.grupo}>
              <span className={estilos.etiqueta}>Modalidad</span>
              <div className={estilos.campoFijo}>
                <span>Fútbol 11</span>
                <span className={estilos.insigniaFija}>Fijo</span>
              </div>
            </div>

            <div className={estilos.grupo}>
              <span className={estilos.etiqueta}>Formato</span>
              <div className={estilos.campoFijo}>
                <span>Liga (Todos vs Todos)</span>
                <span className={estilos.insigniaFija}>Fijo</span>
              </div>
            </div>
          </div>

          <div className={estilos.acciones}>
            <Boton
              id="btn-cancelar-editar-torneo"
              tipo="button"
              variante="secundario"
              alPulsar={alCerrar}
              estaDeshabilitado={guardando}
            >
              Cancelar
            </Boton>
            <Boton
              id="btn-guardar-editar-torneo"
              tipo="submit"
              variante="principal"
              estaCargando={guardando}
              estaDeshabilitado={guardando}
            >
              Guardar cambios
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}
