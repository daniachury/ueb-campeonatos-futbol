import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { Boton } from '../../../common/components/Boton';
import { EstadoVacio } from '../../../common/components/EstadoVacio';
import {
  rutaAdminInscripciones,
  rutaDeInicioSegunRol,
  RUTAS,
} from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { ETIQUETAS_ESTADO_TORNEO, type EstadoTorneo } from '../../../../shared/constants';
import type { TorneoAdminResumen } from '../../../../shared/torneos';
import { ModalCambioObligatorioContrasena } from '../../auth/components/ModalCambioObligatorioContrasena';
import { torneosAdminApi } from '../api/torneos-api';
import { EncabezadoAdmin } from '../components/EncabezadoAdmin';
import { ModalConfirmarApertura } from '../components/ModalConfirmarApertura';
import { ModalCrearTorneo } from '../components/ModalCrearTorneo';
import { ModalEditarTorneo } from '../components/ModalEditarTorneo';
import { ModalEliminarTorneo } from '../components/ModalEliminarTorneo';
import estilos from './GestionDeTorneosPage.module.css';

function formatearFecha(fechaIso: string): string {
  try {
    const partes = fechaIso.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaIso;
  } catch {
    return fechaIso;
  }
}

function claseEtiqueta(estado: EstadoTorneo): string {
  switch (estado) {
    case 'BORRADOR':
      return estilos.etiquetaBorrador;
    case 'INSCRIPCIONES_ABIERTAS':
      return estilos.etiquetaInscripcionesAbiertas;
    case 'EN_CURSO':
      return estilos.etiquetaEnCurso;
    case 'FINALIZADO':
    case 'CANCELADO':
      return estilos.etiquetaFinalizado;
    default:
      return '';
  }
}

export function GestionDeTorneosPage() {
  const { usuarioActual, estaComprobando } = useSesion();
  const [torneos, setTorneos] = useState<TorneoAdminResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [torneoParaAbrir, setTorneoParaAbrir] = useState<TorneoAdminResumen | null>(null);
  const [torneoParaEditar, setTorneoParaEditar] = useState<TorneoAdminResumen | null>(null);
  const [torneoParaEliminar, setTorneoParaEliminar] = useState<TorneoAdminResumen | null>(null);



  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        setCargando(true);
        setError(null);
        const respuesta = await torneosAdminApi.listarAdmin();
        if (activo) {
          setTorneos(respuesta.datos ?? []);
        }
      } catch (err: unknown) {
        if (activo) {
          const msg = err instanceof Error ? err.message : 'Error al cargar torneos';
          setError(msg);
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    if (usuarioActual?.rol === 'admin') {
      void cargar();
    }
    return () => {
      activo = false;
    };
  }, [usuarioActual]);

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  if (usuarioActual.rol !== 'admin') {
    return <Navigate to={rutaDeInicioSegunRol(usuarioActual.rol)} replace />;
  }

  function alCrearTorneoExitoso(nuevoTorneo: TorneoAdminResumen) {
    setTorneos((prev) => [nuevoTorneo, ...prev]);
    setModalCrearAbierto(false);
    setMensajeExito(`Torneo «${nuevoTorneo.nombre}» creado exitosamente en estado Borrador.`);
    setTimeout(() => setMensajeExito(null), 5000);
  }

  function alConfirmarAperturaExitoso(torneoActualizado: TorneoAdminResumen) {
    setTorneos((prev) =>
      prev.map((t) => (t.id === torneoActualizado.id ? torneoActualizado : t)),
    );
    setTorneoParaAbrir(null);
    setMensajeExito(`Inscripciones abiertas exitosamente para «${torneoActualizado.nombre}».`);
    setTimeout(() => setMensajeExito(null), 5000);
  }

  function alEditarTorneoExitoso(torneoActualizado: TorneoAdminResumen) {
    setTorneos((prev) =>
      prev.map((t) => (t.id === torneoActualizado.id ? torneoActualizado : t)),
    );
    setTorneoParaEditar(null);
    setMensajeExito(`Torneo «${torneoActualizado.nombre}» actualizado exitosamente.`);
    setTimeout(() => setMensajeExito(null), 5000);
  }

  function alEliminarTorneoExitoso(id: string, tipo: 'DEFINITIVA' | 'LOGICA') {
    if (tipo === 'DEFINITIVA') {
      setTorneos((prev) => prev.filter((t) => t.id !== id));
      setMensajeExito('Torneo y todos sus registros asociados eliminados definitivamente.');
    } else {
      setTorneos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, estado: 'CANCELADO' as const } : t)),
      );
      setMensajeExito('Torneo cancelado exitosamente conservando su histórico de resultados.');
    }
    setTorneoParaEliminar(null);
    setTimeout(() => setMensajeExito(null), 5000);
  }



  return (
    <div className={estilos.pantalla}>
      <EncabezadoAdmin paginaActual="torneos" />
      <main className={estilos.contenido}>
        <div className={estilos.cabeceraSeccion}>
          <div className={estilos.titulos}>
            <p className={estilos.saludo}>Hola, {usuarioActual.nombreCompleto}</p>
            <h1 className={estilos.titulo}>Gestión de torneos</h1>
          </div>
          <Boton
            id="btn-nuevo-torneo"
            tipo="button"
            variante="principal"
            tamano="mediano"
            anchoCompleto={false}
            alPulsar={() => setModalCrearAbierto(true)}
          >
            + Nuevo torneo
          </Boton>
        </div>

        {mensajeExito && (
          <div className={estilos.alertaExito} role="status">
            ✨ {mensajeExito}
          </div>
        )}

        {error && (
          <div className={estilos.alertaError} role="alert">
            {error}
          </div>
        )}

        {cargando && <p className={estilos.cargando} role="status">Cargando torneos…</p>}

        {!cargando && torneos.length === 0 && (
          <EstadoVacio
            icono="copa"
            titulo="Aún no hay torneos registrados"
            descripcion="Comienza creando el primer torneo de fútbol 11 en formato liga."
            centradoEnEscritorio
          />
        )}

        {!cargando && torneos.length > 0 && (
          <ul className={estilos.listaTorneos} aria-label="Listado de torneos">
            {torneos.map((torneo) => (
              <li
                key={torneo.id}
                className={estilos.tarjetaTorneo}
                data-testid={`tarjeta-torneo-${torneo.id}`}
              >
                <div className={estilos.tarjetaCabecera}>
                  <h2 className={estilos.nombreTorneo}>{torneo.nombre}</h2>
                  <span
                    className={`${estilos.etiqueta} ${claseEtiqueta(torneo.estado)}`}
                    data-testid={`etiqueta-estado-${torneo.id}`}
                  >
                    {ETIQUETAS_ESTADO_TORNEO[torneo.estado] ?? torneo.estado}
                  </span>
                </div>

                {torneo.descripcion && (
                  <p className={estilos.descripcion}>{torneo.descripcion}</p>
                )}

                <div className={estilos.detallesGrid}>
                  <div className={estilos.detalleItem}>
                    <span>Inicio: {formatearFecha(torneo.fechaInicio)}</span>
                  </div>
                  <div className={estilos.detalleItem}>
                    <span>Cupo: {torneo.cupo} equipos</span>
                  </div>
                  <div className={estilos.detalleItem}>
                    <span>Fútbol 11</span>
                  </div>
                  <div className={estilos.detalleItem}>
                    <span>Liga</span>
                  </div>
                </div>

                <div className={estilos.tarjetaPie}>
                  {torneo.estado !== 'FINALIZADO' && torneo.estado !== 'CANCELADO' && (
                    <Boton
                      id={`btn-editar-torneo-${torneo.id}`}
                      tipo="button"
                      variante="secundario"
                      tamano="mediano"
                      anchoCompleto={false}
                      alPulsar={() => setTorneoParaEditar(torneo)}
                    >
                      Editar
                    </Boton>
                  )}
                  {torneo.estado !== 'CANCELADO' && (
                    <Boton
                      id={`btn-eliminar-torneo-${torneo.id}`}
                      tipo="button"
                      variante="secundario"
                      tamano="mediano"
                      anchoCompleto={false}
                      alPulsar={() => setTorneoParaEliminar(torneo)}
                    >
                      Eliminar
                    </Boton>
                  )}
                  {torneo.estado === 'BORRADOR' ? (
                    <Boton
                      id={`btn-abrir-inscripciones-${torneo.id}`}
                      tipo="button"
                      variante="secundario"
                      tamano="mediano"
                      anchoCompleto={false}
                      alPulsar={() => setTorneoParaAbrir(torneo)}
                    >
                      Abrir inscripciones
                    </Boton>
                  ) : (
                    <Link
                      to={rutaAdminInscripciones(torneo.id)}
                      className={estilos.enlaceGestion}
                      id={`enlace-gestionar-${torneo.id}`}
                    >
                      Inscripciones y sorteo →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Modal para crear nuevo torneo */}
      <ModalCrearTorneo
        estaAbierto={modalCrearAbierto}
        alCerrar={() => setModalCrearAbierto(false)}
        alCreado={alCrearTorneoExitoso}
      />

      {/* Modal para confirmar apertura irreversible de inscripciones */}
      <ModalConfirmarApertura
        estaAbierto={Boolean(torneoParaAbrir)}
        torneo={torneoParaAbrir}
        alCerrar={() => setTorneoParaAbrir(null)}
        alConfirmado={alConfirmarAperturaExitoso}
      />

      {/* Modal para editar torneo (KAN-21) */}
      <ModalEditarTorneo
        estaAbierto={Boolean(torneoParaEditar)}
        torneo={torneoParaEditar}
        alCerrar={() => setTorneoParaEditar(null)}
        alEditado={alEditarTorneoExitoso}
      />

      {/* Modal para eliminar torneo (KAN-22) */}
      <ModalEliminarTorneo
        estaAbierto={Boolean(torneoParaEliminar)}
        torneo={torneoParaEliminar}
        alCerrar={() => setTorneoParaEliminar(null)}
        alEliminado={alEliminarTorneoExitoso}
      />



      {usuarioActual.debeCambiarContrasena && (
        <ModalCambioObligatorioContrasena isOpen={true} />
      )}
    </div>
  );
}
