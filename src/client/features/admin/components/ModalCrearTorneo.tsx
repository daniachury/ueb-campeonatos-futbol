import { useState, type FormEvent } from 'react';
import { Boton } from '../../../common/components/Boton';
import {
  obtenerFechaHoyBogota,
  type CrearTorneoDto,
  type RespuestaCrearTorneo,
  type TorneoAdminResumen,
} from '../../../../shared/torneos';
import { torneosAdminApi } from '../api/torneos-api';
import estilos from './ModalCrearTorneo.module.css';

export interface ModalCrearTorneoProps {
  estaAbierto: boolean;
  alCerrar: () => void;
  alCreado: (torneo: TorneoAdminResumen) => void;
  crearFn?: (dto: CrearTorneoDto) => Promise<RespuestaCrearTorneo>;
}

export function ModalCrearTorneo({
  estaAbierto,
  alCerrar,
  alCreado,
  crearFn,
}: ModalCrearTorneoProps) {
  const hoy = obtenerFechaHoyBogota();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [cupo, setCupo] = useState<number | ''>(8);
  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // Errores específicos de campo
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorFecha, setErrorFecha] = useState<string | null>(null);
  const [errorCupo, setErrorCupo] = useState<string | null>(null);

  if (!estaAbierto) return null;

  function limpiarFormulario() {
    setNombre('');
    setDescripcion('');
    setFechaInicio(hoy);
    setCupo(8);
    setErrorGeneral(null);
    setErrorNombre(null);
    setErrorFecha(null);
    setErrorCupo(null);
  }

  function cerrarModal() {
    limpiarFormulario();
    alCerrar();
  }

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    setErrorGeneral(null);
    setErrorNombre(null);
    setErrorFecha(null);
    setErrorCupo(null);

    // Validaciones locales según criterios KAN-20
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 3 || nombreLimpio.length > 80) {
      setErrorNombre('El nombre debe tener entre 3 y 80 caracteres');
      return;
    }

    if (!fechaInicio || fechaInicio < hoy) {
      setErrorFecha('La fecha de inicio no puede ser anterior a hoy');
      return;
    }

    const cupoNum = typeof cupo === 'number' ? cupo : Number(cupo);
    if (isNaN(cupoNum) || cupoNum < 3 || cupoNum > 20) {
      setErrorCupo('El cupo debe estar entre 3 y 20 equipos');
      return;
    }

    setGuardando(true);

    try {
      const dto: CrearTorneoDto = {
        nombre: nombreLimpio,
        descripcion: descripcion.trim() || undefined,
        fechaInicio,
        cupo: cupoNum,
        modalidad: 'FUTBOL_11',
        formato: 'LIGA',
      };

      const ejecutarCrear = crearFn ?? torneosAdminApi.crear;
      const respuesta = await ejecutarCrear(dto);
      limpiarFormulario();
      alCreado(respuesta.torneo);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear el torneo';
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
      aria-labelledby="titulo-modal-crear-torneo"
    >
      <div className={estilos.tarjeta}>
        <div className={estilos.cabecera}>
          <h2 id="titulo-modal-crear-torneo" className={estilos.titulo}>
            🏆 Nuevo torneo
          </h2>
          <button
            type="button"
            className={estilos.cerrar}
            onClick={cerrarModal}
            aria-label="Cerrar modal"
            disabled={guardando}
          >
            ×
          </button>
        </div>

        <form onSubmit={manejarEnvio} noValidate className={estilos.formulario}>
          {errorGeneral && (
            <div className={estilos.alertaError} role="alert">
              ⚠️ {errorGeneral}
            </div>
          )}

          {/* Nombre del torneo */}
          <div className={estilos.grupo}>
            <label htmlFor="nombre-torneo" className={estilos.etiqueta}>
              Nombre del torneo <span className={estilos.obligatorio}>*</span>
            </label>
            <input
              id="nombre-torneo"
              type="text"
              className={estilos.input}
              placeholder="Ej. Copa El Bosque 2026"
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

          {/* Descripción opcional */}
          <div className={estilos.grupo}>
            <label htmlFor="descripcion-torneo" className={estilos.etiqueta}>
              Descripción (opcional)
            </label>
            <textarea
              id="descripcion-torneo"
              className={estilos.textarea}
              placeholder="Información adicional, detalles o reglamento general..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={500}
              disabled={guardando}
            />
            <span className={estilos.ayuda}>Máximo 500 caracteres.</span>
          </div>

          {/* Fecha de inicio y Cupo máximo */}
          <div className={estilos.filaDoble}>
            <div className={estilos.grupo}>
              <label htmlFor="fecha-inicio-torneo" className={estilos.etiqueta}>
                Fecha de inicio <span className={estilos.obligatorio}>*</span>
              </label>
              <input
                id="fecha-inicio-torneo"
                type="date"
                min={hoy}
                className={estilos.input}
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  if (errorFecha) setErrorFecha(null);
                }}
                required
                disabled={guardando}
              />
              {errorFecha && <span className={estilos.errorTexto}>{errorFecha}</span>}
            </div>

            <div className={estilos.grupo}>
              <label htmlFor="cupo-torneo" className={estilos.etiqueta}>
                Cupo máximo <span className={estilos.obligatorio}>*</span>
              </label>
              <input
                id="cupo-torneo"
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
                disabled={guardando}
              />
              {errorCupo && <span className={estilos.errorTexto}>{errorCupo}</span>}
              <span className={estilos.ayuda}>Entre 3 y 20 equipos.</span>
            </div>
          </div>

          {/* Campos fijos del MVP (solo lectura) */}
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

          {/* Acciones */}
          <div className={estilos.acciones}>
            <Boton
              tipo="button"
              variante="secundario"
              tamano="mediano"
              anchoCompleto={false}
              alPulsar={cerrarModal}
              estaDeshabilitado={guardando}
            >
              Cancelar
            </Boton>
            <Boton
              id="btn-guardar-torneo"
              tipo="submit"
              variante="principal"
              tamano="mediano"
              anchoCompleto={false}
              estaDeshabilitado={guardando}
              estaCargando={guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}
