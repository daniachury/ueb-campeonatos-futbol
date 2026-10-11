import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { Boton } from '../../../common/components/Boton';
import { EstadoVacio } from '../../../common/components/EstadoVacio';
import { RUTAS, rutaDeInicioSegunRol } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import type {
  BandejaInscripcionesResponse,
  SolicitudInscripcionResumen,
} from '@shared/inscripciones/contrato-inscripciones';
import type { FixtureTorneoResponse } from '@shared/sorteo/contrato-sorteo';
import {
  aprobarInscripcion,
  inscribirDirectamente,
  obtenerBandejaInscripciones,
  rechazarInscripcion,
  retirarInscripcion,
} from '../api/inscripciones-api';
import { sorteoApi } from '../api/sorteo-api';
import { ModalMotivoInscripcion } from '../components/ModalMotivoInscripcion';
import { PanelInscripcionDirecta } from '../components/PanelInscripcionDirecta';
import { PanelSorteo } from '../components/PanelSorteo';
import { VistaFixture } from '../components/VistaFixture';
import estilos from './InscripcionesPage.module.css';

type PestanaActiva = 'pendientes' | 'aprobados' | 'rechazados' | 'fixture';

export function InscripcionesPage() {
  const { id: torneoId } = useParams<{ id: string }>();
  const { usuarioActual, estaComprobando } = useSesion();

  const [datos, setDatos] = useState<BandejaInscripcionesResponse | null>(null);
  const [fixture, setFixture] = useState<FixtureTorneoResponse | null>(null);
  const [estaCargando, setEstaCargando] = useState(true);
  const [estaCargandoFixture, setEstaCargandoFixture] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [pestanaActiva, setPestanaActiva] = useState<PestanaActiva>('pendientes');

  // Estado para modal de motivo (rechazar o retirar)
  const [solicitudParaMotivo, setSolicitudParaMotivo] = useState<SolicitudInscripcionResumen | null>(null);
  const [tipoMotivo, setTipoMotivo] = useState<'rechazar' | 'retirar'>('rechazar');
  const [estaProcesandoMotivo, setEstaProcesandoMotivo] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // Estado de carga individual para botón Aprobar
  const [aprobandoId, setAprobandoId] = useState<string | null>(null);

  const cargarFixture = useCallback(async (id: string) => {
    try {
      setEstaCargandoFixture(true);
      const res = await sorteoApi.obtenerFixture(id);
      setFixture(res);
      if (res.fechas.length > 0) {
        setPestanaActiva('fixture');
      }
    } catch {
      // Si aún no hay fixture generado no es un error fatal
      setFixture(null);
    } finally {
      setEstaCargandoFixture(false);
    }
  }, []);

  const cargarBandeja = useCallback(
    async (id: string) => {
      try {
        setEstaCargando(true);
        setErrorGeneral(null);
        const res = await obtenerBandejaInscripciones(id);
        setDatos(res);

        if (res.torneo.estado === 'EN_CURSO') {
          await cargarFixture(id);
        }
      } catch (err: unknown) {
        const mensaje = err instanceof Error ? err.message : 'Error al cargar las inscripciones';
        setErrorGeneral(mensaje);
      } finally {
        setEstaCargando(false);
      }
    },
    [cargarFixture],
  );

  useEffect(() => {
    if (!torneoId) return;
    void cargarBandeja(torneoId);
  }, [torneoId, cargarBandeja]);

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  if (usuarioActual.rol !== 'admin') {
    return <Navigate to={rutaDeInicioSegunRol(usuarioActual.rol)} replace />;
  }
  if (!torneoId) {
    return <Navigate to={RUTAS.GESTION_DE_TORNEOS} replace />;
  }

  async function manejarAprobar(solicitud: SolicitudInscripcionResumen) {
    if (datos?.cupoCompleto || datos?.torneoEnCurso || aprobandoId) return;
    try {
      setAprobandoId(solicitud.id);
      setErrorGeneral(null);
      await aprobarInscripcion(solicitud.id);
      setMensajeExito(`¡Solicitud de "${solicitud.equipoNombre}" aprobada!`);
      await cargarBandeja(torneoId!);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo aprobar la solicitud';
      setErrorGeneral(mensaje);
    } finally {
      setAprobandoId(null);
    }
  }

  function abrirModalRechazar(solicitud: SolicitudInscripcionResumen) {
    setSolicitudParaMotivo(solicitud);
    setTipoMotivo('rechazar');
    setErrorModal(null);
  }

  function abrirModalRetirar(solicitud: SolicitudInscripcionResumen) {
    setSolicitudParaMotivo(solicitud);
    setTipoMotivo('retirar');
    setErrorModal(null);
  }

  async function confirmarMotivo(motivo: string) {
    if (!solicitudParaMotivo) return;
    try {
      setEstaProcesandoMotivo(true);
      setErrorModal(null);
      if (tipoMotivo === 'rechazar') {
        await rechazarInscripcion(solicitudParaMotivo.id, motivo);
        setMensajeExito(`Solicitud de "${solicitudParaMotivo.equipoNombre}" rechazada.`);
      } else {
        await retirarInscripcion(solicitudParaMotivo.id, motivo);
        setMensajeExito(`Equipo "${solicitudParaMotivo.equipoNombre}" retirado del torneo.`);
      }
      setSolicitudParaMotivo(null);
      await cargarBandeja(torneoId!);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al procesar la solicitud';
      setErrorModal(mensaje);
    } finally {
      setEstaProcesandoMotivo(false);
    }
  }

  async function manejarInscripcionDirecta(equipoId: string) {
    if (!torneoId) return;
    setErrorGeneral(null);
    try {
      await inscribirDirectamente(torneoId, equipoId);
      setMensajeExito('Equipo inscrito directamente con éxito.');
      await cargarBandeja(torneoId);
      setPestanaActiva('aprobados');
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo inscribir el equipo';
      setErrorGeneral(mensaje);
      throw err;
    }
  }

  async function manejarSorteoCompletado() {
    setMensajeExito('¡Sorteo generado con éxito! El torneo ha iniciado.');
    await cargarBandeja(torneoId!);
  }

  const solicitudesActivas =
    pestanaActiva === 'pendientes'
      ? datos?.pendientes ?? []
      : pestanaActiva === 'aprobados'
        ? datos?.aprobados ?? []
        : pestanaActiva === 'rechazados'
          ? datos?.rechazados ?? []
          : [];

  return (
    <div className={estilos.pantalla}>
      <header className={estilos.encabezado}>
        <Link to={RUTAS.GESTION_DE_TORNEOS} className={estilos.enlaceVolver}>
          ← Gestión de torneos
        </Link>
      </header>

      <main className={estilos.contenido}>
        {estaCargando ? (
          <EstadoVacio
            icono="copa"
            titulo="Cargando inscripciones…"
            descripcion="Consultando el estado de las solicitudes del torneo."
          />
        ) : errorGeneral && !datos ? (
          <div className={estilos.errorBanner}>{errorGeneral}</div>
        ) : (
          datos && (
            <>
              <div className={estilos.cabeceraTorneo}>
                <div className={estilos.titulos}>
                  <p className={estilos.subtitulo}>Inscripciones y sorteo</p>
                  <h1 className={estilos.titulo}>{datos.torneo.nombre}</h1>
                </div>

                <div className={estilos.tarjetaCupo} aria-label="Contador de cupos">
                  <div className={estilos.etiquetaCupo}>
                    <span className={estilos.textoCupo}>Cupos aprobados</span>
                    <span className={estilos.valorCupo}>
                      Aprobados {datos.contadorAprobados}
                    </span>
                  </div>
                  {datos.cupoCompleto && (
                    <span className={estilos.indicadorCupoCompleto}>Cupo completo</span>
                  )}
                </div>
              </div>

              {datos.torneoEnCurso && (
                <div className={estilos.alertaTorneoEnCurso} role="alert">
                  ⚽ El torneo se encuentra en curso. Las inscripciones están cerradas y el fixture está activo.
                </div>
              )}

              {mensajeExito && (
                <div className={estilos.avisoExito} role="status">
                  {mensajeExito}
                </div>
              )}

              {errorGeneral && (
                <div className={estilos.errorBanner} role="alert">
                  {errorGeneral}
                </div>
              )}

              {/* Panel verde de sorteo (cuando está en inscripciones abiertas) */}
              {!datos.torneoEnCurso && (
                <PanelSorteo
                  torneoId={torneoId}
                  equiposAprobados={datos.aprobados.length}
                  solicitudesPendientes={datos.pendientes.length}
                  bloqueado={datos.torneoEnCurso}
                  onSorteoCompletado={manejarSorteoCompletado}
                />
              )}

              {/* Selector de pestañas */}
              <div className={estilos.barraPestanas} role="tablist" aria-label="Pestañas de inscripciones">
                {fixture && fixture.fechas.length > 0 && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={pestanaActiva === 'fixture'}
                    className={`${estilos.botonPestana} ${
                      pestanaActiva === 'fixture' ? estilos.botonPestanaActiva : ''
                    }`}
                    onClick={() => setPestanaActiva('fixture')}
                  >
                    📅 Fixture / Cruces
                    <span className={estilos.insigniaConteo}>{fixture.totalFechas}</span>
                  </button>
                )}

                <button
                  type="button"
                  role="tab"
                  aria-selected={pestanaActiva === 'pendientes'}
                  className={`${estilos.botonPestana} ${
                    pestanaActiva === 'pendientes' ? estilos.botonPestanaActiva : ''
                  }`}
                  onClick={() => setPestanaActiva('pendientes')}
                >
                  Pendientes
                  <span className={estilos.insigniaConteo}>{datos.pendientes.length}</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={pestanaActiva === 'aprobados'}
                  className={`${estilos.botonPestana} ${
                    pestanaActiva === 'aprobados' ? estilos.botonPestanaActiva : ''
                  }`}
                  onClick={() => setPestanaActiva('aprobados')}
                >
                  Aprobados
                  <span className={estilos.insigniaConteo}>{datos.aprobados.length}</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={pestanaActiva === 'rechazados'}
                  className={`${estilos.botonPestana} ${
                    pestanaActiva === 'rechazados' ? estilos.botonPestanaActiva : ''
                  }`}
                  onClick={() => setPestanaActiva('rechazados')}
                >
                  Rechazados
                  <span className={estilos.insigniaConteo}>{datos.rechazados.length}</span>
                </button>
              </div>

              {/* Vista según pestaña */}
              {pestanaActiva === 'fixture' && fixture ? (
                <VistaFixture
                  fixture={fixture}
                  cargando={estaCargandoFixture}
                  onFixtureActualizado={() => cargarFixture(torneoId)}
                />
              ) : (
                /* Lista de solicitudes de la pestaña activa */
                <section className={estilos.listaSolicitudes} aria-label={`Lista de solicitudes ${pestanaActiva}`}>
                  {solicitudesActivas.length === 0 ? (
                    <EstadoVacio
                      icono="escudo"
                      titulo={`No hay solicitudes en ${pestanaActiva}`}
                      descripcion="Las solicitudes aparecerán aquí según su estado de aprobación."
                    />
                  ) : (
                    solicitudesActivas.map((solicitud) => {
                      const estaAprobandoEste = aprobandoId === solicitud.id;

                      return (
                        <article key={solicitud.id} className={estilos.tarjetaSolicitud}>
                          <div className={estilos.infoPrincipal}>
                            <div className={estilos.filaEquipo}>
                              {solicitud.equipoColor && (
                                <span
                                  className={estilos.puntoColor}
                                  style={{ backgroundColor: solicitud.equipoColor }}
                                  aria-hidden="true"
                                />
                              )}
                              <h2 className={estilos.nombreEquipo}>{solicitud.equipoNombre}</h2>
                            </div>

                            <div className={estilos.metadatos}>
                              <span>Capitán: {solicitud.capitanNombre}</span>
                              <span>{solicitud.cantidadJugadores} jugadores</span>
                              <span>
                                Solicitud:{' '}
                                {new Date(solicitud.fechaSolicitud).toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>

                            {solicitud.motivo && (
                              <div className={estilos.cajaMotivo}>
                                <strong>Motivo:</strong> {solicitud.motivo}
                              </div>
                            )}
                          </div>

                          {/* Botones de acción según pestaña */}
                          <div className={estilos.accionesSolicitud}>
                            {pestanaActiva === 'pendientes' && (
                              <>
                                <Boton
                                  variante="secundario"
                                  tamano="mediano"
                                  anchoCompleto={false}
                                  estaDeshabilitado={datos.torneoEnCurso}
                                  alPulsar={() => abrirModalRechazar(solicitud)}
                                >
                                  Rechazar
                                </Boton>
                                <Boton
                                  variante="principal"
                                  tamano="mediano"
                                  anchoCompleto={false}
                                  estaDeshabilitado={
                                    datos.cupoCompleto ||
                                    datos.torneoEnCurso ||
                                    solicitud.cantidadJugadores < 11 ||
                                    estaAprobandoEste
                                  }
                                  estaCargando={estaAprobandoEste}
                                  alPulsar={() => void manejarAprobar(solicitud)}
                                >
                                  {datos.cupoCompleto ? 'Cupo completo' : 'Aprobar'}
                                </Boton>
                              </>
                            )}

                            {pestanaActiva === 'aprobados' && (
                              <Boton
                                variante="secundario"
                                tamano="mediano"
                                anchoCompleto={false}
                                estaDeshabilitado={
                                  datos.torneoEnCurso ||
                                  datos.torneo.estado !== 'INSCRIPCIONES_ABIERTAS'
                                }
                                alPulsar={() => abrirModalRetirar(solicitud)}
                              >
                                Retirar
                              </Boton>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>
              )}

              {/* Panel de Inscripción Directa */}
              {!datos.torneoEnCurso && (
                <PanelInscripcionDirecta
                  torneoId={torneoId}
                  cupoCompleto={datos.cupoCompleto}
                  torneoEnCurso={datos.torneoEnCurso}
                  alInscribir={manejarInscripcionDirecta}
                />
              )}

              {/* Modal para captura obligatoria de motivo */}
              <ModalMotivoInscripcion
                estaAbierto={solicitudParaMotivo !== null}
                titulo={
                  tipoMotivo === 'rechazar'
                    ? 'Rechazar solicitud de inscripción'
                    : 'Retirar equipo aprobado'
                }
                descripcion={
                  tipoMotivo === 'rechazar'
                    ? `Indica el motivo por el cual rechazas la solicitud de "${solicitudParaMotivo?.equipoNombre}". El capitán podrá ver este motivo.`
                    : `Indica el motivo por el cual retiras al equipo "${solicitudParaMotivo?.equipoNombre}". Esto liberará un cupo en el torneo.`
                }
                textoConfirmar={tipoMotivo === 'rechazar' ? 'Rechazar solicitud' : 'Retirar equipo'}
                estaCargando={estaProcesandoMotivo}
                errorExterno={errorModal}
                alConfirmar={(motivo) => void confirmarMotivo(motivo)}
                alCerrar={() => setSolicitudParaMotivo(null)}
              />
            </>
          )
        )}
      </main>
    </div>
  );
}
