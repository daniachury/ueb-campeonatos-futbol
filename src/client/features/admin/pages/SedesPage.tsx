import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { Boton } from '../../../common/components/Boton';
import { EstadoVacio } from '../../../common/components/EstadoVacio';
import { RUTAS, rutaDeInicioSegunRol } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import type {
  CanchaResumen,
  SedeResumen,
  SuperficieCancha,
} from '../../../../shared/sedes/contrato-sedes';
import { sedesApi } from '../api/sedes-api';
import { ModalCancha } from '../components/ModalCancha';
import { ModalConfirmarEliminar } from '../components/ModalConfirmarEliminar';
import { ModalSede } from '../components/ModalSede';
import estilos from './SedesPage.module.css';

export function SedesPage() {
  const { usuarioActual, estaComprobando } = useSesion();

  const [sedes, setSedes] = useState<SedeResumen[]>([]);
  const [estaCargando, setEstaCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estados de modal Sede
  const [modalSedeAbierto, setModalSedeAbierto] = useState(false);
  const [sedeParaEditar, setSedeParaEditar] = useState<SedeResumen | null>(null);
  const [estaGuardandoSede, setEstaGuardandoSede] = useState(false);

  // Estados de modal Cancha
  const [modalCanchaAbierto, setModalCanchaAbierto] = useState(false);
  const [sedeParaCancha, setSedeParaCancha] = useState<SedeResumen | null>(null);
  const [canchaParaEditar, setCanchaParaEditar] = useState<CanchaResumen | null>(null);
  const [estaGuardandoCancha, setEstaGuardandoCancha] = useState(false);

  // Estados de modal Eliminar
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [elementoParaEliminar, setElementoParaEliminar] = useState<{
    tipo: 'sede' | 'cancha';
    id: string;
    sedeId?: string;
    nombre: string;
  } | null>(null);
  const [estaEliminando, setEstaEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  const cargarSedes = useCallback(async () => {
    try {
      setEstaCargando(true);
      setErrorGeneral(null);
      const res = await sedesApi.obtenerSedes();
      setSedes(res);
    } catch (err: unknown) {
      setErrorGeneral(err instanceof Error ? err.message : 'Error al cargar las sedes');
    } finally {
      setEstaCargando(false);
    }
  }, []);

  useEffect(() => {
    if (usuarioActual?.rol === 'admin') {
      void cargarSedes();
    }
  }, [usuarioActual, cargarSedes]);

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  if (usuarioActual.rol !== 'admin') {
    return (
      <div className={estilos.pantalla} data-testid="estado-403">
        <main className={estilos.contenedor403}>
          <div className={estilos.tarjeta403} role="alert">
            <span className={estilos.icono403} aria-hidden="true">🚫</span>
            <h1 className={estilos.titulo403}>Acceso no autorizado (403)</h1>
            <p className={estilos.descripcion403}>
              No tienes permisos de administrador para gestionar sedes y canchas. Esta sección está reservada exclusivamente para la administración del torneo.
            </p>
            <div className={estilos.acciones403}>
              <Link
                to={rutaDeInicioSegunRol(usuarioActual.rol)}
                className={estilos.botonVolverInicio}
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Guardar Sede (crear o editar)
  async function manejarGuardarSede(datos: {
    nombre: string;
    direccion: string;
    ciudad: string;
    indicaciones?: string;
  }) {
    setEstaGuardandoSede(true);
    try {
      if (sedeParaEditar) {
        await sedesApi.actualizarSede(sedeParaEditar.id, datos);
        setMensajeExito(`Sede "${datos.nombre}" actualizada con éxito.`);
      } else {
        await sedesApi.crearSede(datos);
        setMensajeExito(`Sede "${datos.nombre}" creada con éxito.`);
      }
      setModalSedeAbierto(false);
      setSedeParaEditar(null);
      await cargarSedes();
    } finally {
      setEstaGuardandoSede(false);
    }
  }

  // Guardar Cancha (crear o editar)
  async function manejarGuardarCancha(datos: {
    nombre: string;
    superficie?: SuperficieCancha | null;
    activa: boolean;
  }) {
    if (!sedeParaCancha) return;
    setEstaGuardandoCancha(true);
    try {
      if (canchaParaEditar) {
        await sedesApi.actualizarCancha(sedeParaCancha.id, canchaParaEditar.id, datos);
        setMensajeExito(`Cancha "${datos.nombre}" actualizada con éxito.`);
      } else {
        await sedesApi.crearCancha(sedeParaCancha.id, datos);
        setMensajeExito(`Cancha "${datos.nombre}" agregada a ${sedeParaCancha.nombre}.`);
      }
      setModalCanchaAbierto(false);
      setCanchaParaEditar(null);
      setSedeParaCancha(null);
      await cargarSedes();
    } finally {
      setEstaGuardandoCancha(false);
    }
  }

  // Conmutar activa/inactiva
  async function manejarAlternarActiva(sedeId: string, cancha: CanchaResumen) {
    try {
      await sedesApi.actualizarCancha(sedeId, cancha.id, { activa: !cancha.activa });
      setMensajeExito(
        `Cancha "${cancha.nombre}" ${!cancha.activa ? 'activada' : 'desactivada'}.`,
      );
      await cargarSedes();
    } catch (err: unknown) {
      setErrorGeneral(err instanceof Error ? err.message : 'Error al cambiar estado de cancha');
    }
  }

  // Eliminar
  async function confirmarEliminacion() {
    if (!elementoParaEliminar) return;
    setEstaEliminando(true);
    setErrorEliminar(null);
    try {
      if (elementoParaEliminar.tipo === 'sede') {
        await sedesApi.eliminarSede(elementoParaEliminar.id);
        setMensajeExito(`Sede "${elementoParaEliminar.nombre}" eliminada con éxito.`);
      } else if (elementoParaEliminar.sedeId) {
        await sedesApi.eliminarCancha(elementoParaEliminar.sedeId, elementoParaEliminar.id);
        setMensajeExito(`Cancha "${elementoParaEliminar.nombre}" eliminada con éxito.`);
      }
      setModalEliminarAbierto(false);
      setElementoParaEliminar(null);
      await cargarSedes();
    } catch (err: unknown) {
      setErrorEliminar(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setEstaEliminando(false);
    }
  }

  return (
    <div className={estilos.pantalla} data-testid="pagina-sedes">
      <header className={estilos.encabezado}>
        <Link to={RUTAS.GESTION_DE_TORNEOS} className={estilos.enlaceVolver}>
          ← Volver a Torneos
        </Link>
        <div className={estilos.filaTitulo}>
          <div>
            <h1 className={estilos.titulo}>Sedes y canchas</h1>
            <p className={estilos.subtitulo}>
              Registra los lugares donde se juegan los partidos y gestiona sus canchas.
            </p>
          </div>
          {usuarioActual.rol === 'admin' && (
            <Boton
              tipo="button"
              variante="principal"
              tamano="mediano"
              anchoCompleto={false}
              alPulsar={() => {
                setSedeParaEditar(null);
                setModalSedeAbierto(true);
              }}
            >
              + Nueva sede
            </Boton>
          )}
        </div>
      </header>

      {mensajeExito && <div className={estilos.avisoExito}>{mensajeExito}</div>}
      {errorGeneral && <div className={estilos.avisoError}>{errorGeneral}</div>}

      <main>
        {estaCargando ? (
          <div className={estilos.cargando}>Cargando sedes y canchas…</div>
        ) : sedes.length === 0 ? (
          <EstadoVacio
            icono="escudo"
            titulo="No hay sedes registradas"
            descripcion="Crea la primera sede deportiva para poder agregar canchas y programar partidos."
            centradoEnEscritorio
          />
        ) : (
          <div className={estilos.listaSedes}>
            {sedes.map((sede) => (
              <article key={sede.id} className={estilos.tarjetaSede}>
                <div className={estilos.cabeceraSede}>
                  <div className={estilos.infoSede}>
                    <h2 className={estilos.nombreSede}>{sede.nombre}</h2>
                    <div className={estilos.detallesSede}>
                      <span>📍 {sede.direccion}</span>
                      <span>🏙️ {sede.ciudad}</span>
                      <span>⚽ {sede.totalCanchas} canchas</span>
                      {sede.totalPartidosProgramados > 0 && (
                        <span>📅 {sede.totalPartidosProgramados} partidos programados</span>
                      )}
                    </div>
                    {sede.indicaciones && (
                      <p className={estilos.indicaciones}>ℹ️ {sede.indicaciones}</p>
                    )}
                  </div>

                  <div className={estilos.accionesSede}>
                    <Boton
                      tipo="button"
                      variante="secundario"
                      tamano="mediano"
                      anchoCompleto={false}
                      alPulsar={() => {
                        setSedeParaEditar(sede);
                        setModalSedeAbierto(true);
                      }}
                    >
                      Editar sede
                    </Boton>
                    <Boton
                      tipo="button"
                      variante="secundario"
                      tamano="mediano"
                      anchoCompleto={false}
                      alPulsar={() => {
                        setElementoParaEliminar({
                          tipo: 'sede',
                          id: sede.id,
                          nombre: sede.nombre,
                        });
                        setErrorEliminar(null);
                        setModalEliminarAbierto(true);
                      }}
                    >
                      Eliminar sede
                    </Boton>
                    <Boton
                      tipo="button"
                      variante="principal"
                      tamano="mediano"
                      anchoCompleto={false}
                      alPulsar={() => {
                        setSedeParaCancha(sede);
                        setCanchaParaEditar(null);
                        setModalCanchaAbierto(true);
                      }}
                    >
                      + Agregar cancha
                    </Boton>
                  </div>
                </div>

                <div className={estilos.seccionCanchas}>
                  <h3 className={estilos.tituloCanchas}>
                    <span>🏟️</span> Canchas disponibles en esta sede
                  </h3>

                  {sede.canchas.length === 0 ? (
                    <p className={estilos.sinCanchas}>
                      Esta sede no tiene canchas registradas aún.
                    </p>
                  ) : (
                    <div className={estilos.grillaCanchas}>
                      {sede.canchas.map((cancha) => (
                        <div key={cancha.id} className={estilos.tarjetaCancha}>
                          <div className={estilos.filaCanchaInfo}>
                            <h4 className={estilos.nombreCancha}>{cancha.nombre}</h4>
                            <div className={estilos.badgetsCancha}>
                              {cancha.superficie && (
                                <span
                                  className={`${estilos.badge} ${estilos.badgeSuperficie}`}
                                >
                                  {cancha.superficie}
                                </span>
                              )}
                              <span
                                className={`${estilos.badge} ${
                                  cancha.activa ? estilos.badgeActiva : estilos.badgeInactiva
                                }`}
                              >
                                {cancha.activa ? 'Activa' : 'Inactiva'}
                              </span>
                            </div>
                          </div>

                          <span className={estilos.badgePartidos}>
                            {cancha.partidosProgramados === 0
                              ? '0 partidos programados'
                              : `${cancha.partidosProgramados} partidos programados`}
                          </span>

                          <div className={estilos.accionesCancha}>
                            <Boton
                              tipo="button"
                              variante="secundario"
                              tamano="mediano"
                              anchoCompleto={false}
                              alPulsar={() => void manejarAlternarActiva(sede.id, cancha)}
                            >
                              {cancha.activa ? 'Desactivar' : 'Activar'}
                            </Boton>
                            <Boton
                              tipo="button"
                              variante="secundario"
                              tamano="mediano"
                              anchoCompleto={false}
                              alPulsar={() => {
                                setSedeParaCancha(sede);
                                setCanchaParaEditar(cancha);
                                setModalCanchaAbierto(true);
                              }}
                            >
                              Editar
                            </Boton>
                            <Boton
                              tipo="button"
                              variante="secundario"
                              tamano="mediano"
                              anchoCompleto={false}
                              data-testid={`eliminar-cancha-${cancha.id}`}
                              alPulsar={() => {
                                setElementoParaEliminar({
                                    tipo: 'cancha',
                                    id: cancha.id,
                                    sedeId: sede.id,
                                    nombre: cancha.nombre,
                                });
                                setErrorEliminar(null);
                                setModalEliminarAbierto(true);
                              }}
                            >
                              Eliminar
                            </Boton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Modales */}
      <ModalSede
        estaAbierto={modalSedeAbierto}
        sedeEditar={sedeParaEditar}
        estaCargando={estaGuardandoSede}
        alGuardar={manejarGuardarSede}
        alCerrar={() => {
          setModalSedeAbierto(false);
          setSedeParaEditar(null);
        }}
      />

      {sedeParaCancha && (
        <ModalCancha
          estaAbierto={modalCanchaAbierto}
          sedeNombre={sedeParaCancha.nombre}
          canchaEditar={canchaParaEditar}
          estaCargando={estaGuardandoCancha}
          alGuardar={manejarGuardarCancha}
          alCerrar={() => {
            setModalCanchaAbierto(false);
            setCanchaParaEditar(null);
            setSedeParaCancha(null);
          }}
        />
      )}

      <ModalConfirmarEliminar
        estaAbierto={modalEliminarAbierto}
        titulo={
          elementoParaEliminar?.tipo === 'sede'
            ? `¿Eliminar sede "${elementoParaEliminar?.nombre}"?`
            : `¿Eliminar cancha "${elementoParaEliminar?.nombre}"?`
        }
        mensaje={
          elementoParaEliminar?.tipo === 'sede'
            ? 'Esta acción eliminará la sede y todas sus canchas asociadas que no tengan partidos pendientes.'
            : 'Esta acción eliminará la cancha permanentemente. No se puede deshacer.'
        }
        estaCargando={estaEliminando}
        error={errorEliminar}
        alConfirmar={confirmarEliminacion}
        alCerrar={() => {
          setModalEliminarAbierto(false);
          setElementoParaEliminar(null);
          setErrorEliminar(null);
        }}
      />
    </div>
  );
}
