import { useEffect, useState } from 'react';
import estilos from './ModalGestionEquipo.module.css';

interface Equipo {
  id: string;
  nombre: string;
  color: string;
  capitanId?: string;
}

interface Integrante {
  id: string;
  nombreCompleto: string;
  correo: string;
}

interface Solicitud {
  id: string;
  equipoId: string;
  usuarioId: string;
  nombreCompleto: string;
  correo: string;
  estado: string;
  creadaEn: string;
}

interface ModalGestionEquipoProps {
  equipo: Equipo;
  esCapitan: boolean;
  alCerrar: () => void;
  alActualizarEquipo: (actualizado: { nombre: string; color: string }) => void;
}

export function ModalGestionEquipo({
  equipo,
  esCapitan,
  alCerrar,
  alActualizarEquipo,
}: ModalGestionEquipoProps) {
  const [pestana, setPestana] = useState<'plantilla' | 'solicitudes' | 'datos'>('plantilla');
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);

  const [nombreEquipo, setNombreEquipo] = useState(equipo.nombre);
  const [colorEquipo, setColorEquipo] = useState(equipo.color);

  // Formulario de agregar jugador
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const resInt = await fetch(`/api/equipos/${equipo.id}/integrantes`);
      if (resInt.ok) {
        const datosInt = (await resInt.json()) as { datos: Integrante[] };
        setIntegrantes(datosInt.datos ?? []);
      }

      if (esCapitan) {
        const resSol = await fetch(`/api/equipos/${equipo.id}/solicitudes`);
        if (resSol.ok) {
          const datosSol = (await resSol.json()) as { datos: Solicitud[] };
          setSolicitudes(datosSol.datos ?? []);
        }
      }
    } catch {
      // Ignorar errores de conexión
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipo.id, esCapitan]);

  const limpiarMensajes = () => {
    setMensajeExito('');
    setMensajeError('');
  };

  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    limpiarMensajes();

    try {
      const respuesta = await fetch(`/api/equipos/${equipo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreEquipo.trim(), color: colorEquipo.trim() }),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => null)) as { mensaje?: string } | null;
        setMensajeError(cuerpo?.mensaje ?? 'No se pudo guardar la información del equipo.');
        return;
      }

      setMensajeExito('Datos del equipo actualizados correctamente.');
      alActualizarEquipo({ nombre: nombreEquipo.trim(), color: colorEquipo.trim() });
    } catch {
      setMensajeError('Error de conexión al guardar los datos.');
    }
  };

  const handleAgregarJugador = async (e: React.FormEvent) => {
    e.preventDefault();
    limpiarMensajes();

    if (!nuevoNombre.trim() || !nuevoCorreo.trim()) return;

    try {
      setEnviando(true);
      const respuesta = await fetch(`/api/equipos/${equipo.id}/jugadores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCompleto: nuevoNombre.trim(),
          correo: nuevoCorreo.trim(),
          telefono: nuevoTelefono.trim() || undefined,
        }),
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => null)) as { mensaje?: string } | null;
        setMensajeError(cuerpo?.mensaje ?? 'No se pudo agregar al jugador.');
        return;
      }

      setMensajeExito(`¡Jugador ${nuevoNombre.trim()} agregado con éxito!`);
      setNuevoNombre('');
      setNuevoCorreo('');
      setNuevoTelefono('');
      void cargarDatos();
    } catch {
      setMensajeError('Error de conexión al agregar el jugador.');
    } finally {
      setEnviando(false);
    }
  };

  const handleRetirarJugador = async (integrante: Integrante) => {
    if (!window.confirm(`¿Seguro que deseas retirar a ${integrante.nombreCompleto} de la plantilla?`)) {
      return;
    }
    limpiarMensajes();

    try {
      const respuesta = await fetch(`/api/equipos/${equipo.id}/jugadores/${integrante.id}`, {
        method: 'DELETE',
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => null)) as { mensaje?: string } | null;
        setMensajeError(cuerpo?.mensaje ?? 'No se pudo retirar al jugador.');
        return;
      }

      setMensajeExito(`Jugador ${integrante.nombreCompleto} retirado.`);
      void cargarDatos();
    } catch {
      setMensajeError('Error de red al retirar al jugador.');
    }
  };

  const handleAprobarSolicitud = async (solicitud: Solicitud) => {
    limpiarMensajes();
    try {
      const respuesta = await fetch(`/api/equipos/${equipo.id}/solicitudes/${solicitud.id}/aprobar`, {
        method: 'POST',
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => null)) as { mensaje?: string } | null;
        setMensajeError(cuerpo?.mensaje ?? 'No se pudo aprobar la solicitud.');
        return;
      }

      setMensajeExito(`Solicitud de ${solicitud.nombreCompleto} aprobada.`);
      void cargarDatos();
    } catch {
      setMensajeError('Error de conexión al aprobar la solicitud.');
    }
  };

  const handleRechazarSolicitud = async (solicitud: Solicitud) => {
    limpiarMensajes();
    try {
      const respuesta = await fetch(`/api/equipos/${equipo.id}/solicitudes/${solicitud.id}/rechazar`, {
        method: 'POST',
      });

      if (!respuesta.ok) {
        const cuerpo = (await respuesta.json().catch(() => null)) as { mensaje?: string } | null;
        setMensajeError(cuerpo?.mensaje ?? 'No se pudo negar la solicitud.');
        return;
      }

      setMensajeExito(`Solicitud de ${solicitud.nombreCompleto} rechazada.`);
      void cargarDatos();
    } catch {
      setMensajeError('Error de conexión al negar la solicitud.');
    }
  };

  const getIniciales = (nombre: string) => {
    return nombre
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={estilos.fondo} role="dialog" aria-modal="true" aria-labelledby="modal-equipo-titulo">
      <div className={estilos.modal}>
        <header className={estilos.encabezado}>
          <div className={estilos.tituloConColor}>
            <span className={estilos.colorMuestra} style={{ backgroundColor: equipo.color }} />
            <div>
              <h2 id="modal-equipo-titulo">{nombreEquipo}</h2>
              <span className={estilos.rolBadge}>{esCapitan ? 'Gestión de Capitán' : 'Integrante'}</span>
            </div>
          </div>
          <button
            type="button"
            className={estilos.botonCerrar}
            onClick={alCerrar}
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        </header>

        <nav className={estilos.pestanas}>
          <button
            type="button"
            className={`${estilos.pestana} ${pestana === 'plantilla' ? estilos.pestanaActiva : ''}`}
            onClick={() => {
              setPestana('plantilla');
              limpiarMensajes();
            }}
          >
            Plantilla ({integrantes.length})
          </button>

          {esCapitan && (
            <button
              type="button"
              className={`${estilos.pestana} ${pestana === 'solicitudes' ? estilos.pestanaActiva : ''}`}
              onClick={() => {
                setPestana('solicitudes');
                limpiarMensajes();
              }}
            >
              Solicitudes
              {solicitudes.length > 0 && (
                <span className={estilos.conteoBadge}>{solicitudes.length}</span>
              )}
            </button>
          )}

          {esCapitan && (
            <button
              type="button"
              className={`${estilos.pestana} ${pestana === 'datos' ? estilos.pestanaActiva : ''}`}
              onClick={() => {
                setPestana('datos');
                limpiarMensajes();
              }}
            >
              Datos del equipo
            </button>
          )}
        </nav>

        <div className={estilos.cuerpo}>
          {mensajeExito && <div className={estilos.alertaExito} role="status">{mensajeExito}</div>}
          {mensajeError && <div className={estilos.alertaError} role="alert">{mensajeError}</div>}

          {/* PESTAÑA: PLANTILLA */}
          {pestana === 'plantilla' && (
            <>
              <div className={estilos.plantillaHeader}>
                <span className={estilos.contadorJugadores}>
                  {integrantes.length} de 11 jugadores requeridos (mín. 11, máx. 25)
                </span>
                {integrantes.length < 11 ? (
                  <div className={estilos.alertaAviso}>
                    Faltan {11 - integrantes.length} jugadores para poder inscribir al equipo en torneos oficiales.
                  </div>
                ) : (
                  <div className={estilos.alertaExito}>
                    ✓ Plantilla completa con el mínimo requerido para torneos.
                  </div>
                )}
              </div>

              {/* Formulario solo para el capitán */}
              {esCapitan && (
                <section className={estilos.cajaAgregar}>
                  <h4>Crear o agregar jugador a la plantilla</h4>
                  <form onSubmit={(e) => void handleAgregarJugador(e)} className={estilos.formulario}>
                    <div className={estilos.filasInputs}>
                      <label className={estilos.campo}>
                        Nombre completo
                        <input
                          type="text"
                          required
                          minLength={3}
                          maxLength={80}
                          placeholder="Ej: Mateo Cárdenas"
                          value={nuevoNombre}
                          onChange={(e) => setNuevoNombre(e.target.value)}
                        />
                      </label>
                      <label className={estilos.campo}>
                        Correo electrónico
                        <input
                          type="email"
                          required
                          placeholder="mateo.cardenas@unbosque.edu.co"
                          value={nuevoCorreo}
                          onChange={(e) => setNuevoCorreo(e.target.value)}
                        />
                      </label>
                    </div>
                    <label className={estilos.campo}>
                      Teléfono (opcional)
                      <input
                        type="tel"
                        placeholder="3104000001"
                        value={nuevoTelefono}
                        onChange={(e) => setNuevoTelefono(e.target.value)}
                      />
                    </label>
                    <button type="submit" className={estilos.botonPrimario} disabled={enviando}>
                      {enviando ? 'Guardando...' : '+ Crear jugador'}
                    </button>
                  </form>
                </section>
              )}

              {/* Listado de integrantes */}
              <div className={estilos.listaItems}>
                {cargando ? (
                  <p className={estilos.vacio}>Cargando plantilla...</p>
                ) : integrantes.length === 0 ? (
                  <p className={estilos.vacio}>Aún no hay jugadores registrados.</p>
                ) : (
                  integrantes.map((jugador) => {
                    const esElCapitan = jugador.id === equipo.capitanId;
                    return (
                      <article key={jugador.id} className={estilos.itemJugador}>
                        <div className={estilos.datosJugador}>
                          <span className={estilos.avatar}>{getIniciales(jugador.nombreCompleto)}</span>
                          <div>
                            <p className={estilos.nombre}>{jugador.nombreCompleto}</p>
                            <p className={estilos.correo}>{jugador.correo}</p>
                          </div>
                        </div>

                        {esElCapitan ? (
                          <span className={estilos.capitanTag}>Capitán</span>
                        ) : esCapitan ? (
                          <button
                            type="button"
                            className={estilos.botonRetirar}
                            onClick={() => void handleRetirarJugador(jugador)}
                          >
                            Retirar
                          </button>
                        ) : null}
                      </article>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* PESTAÑA: SOLICITUDES DE UNIÓN */}
          {pestana === 'solicitudes' && esCapitan && (
            <div className={estilos.listaItems}>
              {cargando ? (
                <p className={estilos.vacio}>Cargando solicitudes...</p>
              ) : solicitudes.length === 0 ? (
                <p className={estilos.vacio}>No hay solicitudes de ingreso pendientes en este momento.</p>
              ) : (
                solicitudes.map((sol) => (
                  <article key={sol.id} className={estilos.itemSolicitud}>
                    <div className={estilos.datosJugador}>
                      <span className={estilos.avatar}>{getIniciales(sol.nombreCompleto)}</span>
                      <div>
                        <p className={estilos.nombre}>{sol.nombreCompleto}</p>
                        <p className={estilos.correo}>{sol.correo}</p>
                      </div>
                    </div>
                    <div className={estilos.accionesSolicitud}>
                      <button
                        type="button"
                        className={estilos.botonAprobar}
                        onClick={() => void handleAprobarSolicitud(sol)}
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        className={estilos.botonRechazar}
                        onClick={() => void handleRechazarSolicitud(sol)}
                      >
                        Negar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {/* PESTAÑA: DATOS DEL EQUIPO */}
          {pestana === 'datos' && esCapitan && (
            <form onSubmit={(e) => void handleGuardarDatos(e)} className={estilos.formulario}>
              <label className={estilos.campo}>
                Nombre del equipo
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={60}
                  value={nombreEquipo}
                  onChange={(e) => setNombreEquipo(e.target.value)}
                />
              </label>

              <label className={estilos.campo}>
                Color del equipo
                <input
                  type="text"
                  required
                  maxLength={30}
                  value={colorEquipo}
                  onChange={(e) => setColorEquipo(e.target.value)}
                />
              </label>

              <button type="submit" className={estilos.botonPrimario}>
                Guardar cambios
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
