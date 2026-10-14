import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import type { ResumenEstadisticasAdmin } from '../../../../shared/admin/contrato-estadisticas';
import { obtenerEstadisticasAdmin } from '../api/estadisticas-api';
import { EncabezadoAdmin } from '../components/EncabezadoAdmin';
import { ModalCambioObligatorioContrasena } from '../../auth/components/ModalCambioObligatorioContrasena';
import estilos from './PanelAdminPage.module.css';

export function PanelAdminPage() {
  const { usuarioActual, estaComprobando } = useSesion();
  const [estadisticas, setEstadisticas] = useState<ResumenEstadisticasAdmin | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!usuarioActual || usuarioActual.rol !== 'admin') return;
    let cancelado = false;
    obtenerEstadisticasAdmin()
      .then((datos) => {
        if (!cancelado) {
          setEstadisticas(datos);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelado) {
          setError(err.message || 'No se pudieron cargar las estadísticas en tiempo real');
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [usuarioActual]);

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  if (usuarioActual.rol !== 'admin') return <Navigate to={RUTAS.INICIO_DEL_JUGADOR} replace />;

  return (
    <div className={estilos.pantalla}>
      <EncabezadoAdmin paginaActual="otro" />
      <main className={estilos.contenido}>
        <header className={estilos.cabeceraSeccion}>
          <div className={estilos.titulos}>
            <p className={estilos.saludo}>Hola, {usuarioActual.nombreCompleto}</p>
            <h1 className={estilos.titulo}>Panel de administración</h1>
            <p className={estilos.descripcion}>
              Métricas operativas del campeonato deportivo y accesos directos de gestión en tiempo real.
            </p>
          </div>
        </header>

        {error ? (
          <div className={estilos.error} role="alert">
            {error}
          </div>
        ) : null}

        <section aria-labelledby="seccion-metricas" className={estilos.bloque}>
          <h2 id="seccion-metricas" className={estilos.seccionTitulo}>Métricas globales</h2>
          <div className={estilos.resumen}>
            <article className={estilos.tarjetaMetrica}>
              <strong>{cargando ? '…' : (estadisticas?.torneos ?? 0)}</strong>
              <span>Torneos creados</span>
            </article>
            <article className={estilos.tarjetaMetrica}>
              <strong>{cargando ? '…' : (estadisticas?.equipos ?? 0)}</strong>
              <span>Equipos registrados</span>
            </article>
            <article className={estilos.tarjetaMetrica}>
              <strong>{cargando ? '…' : (estadisticas?.partidos ?? 0)}</strong>
              <span>Partidos generados</span>
            </article>
            <article className={estilos.tarjetaMetrica}>
              <strong>{cargando ? '…' : (estadisticas?.jugadores ?? 0)}</strong>
              <span>Jugadores activos</span>
            </article>
            <article className={estilos.tarjetaMetrica}>
              <strong>{cargando ? '…' : (estadisticas?.pendientes ?? 0)}</strong>
              <span>Solicitudes pendientes</span>
            </article>
          </div>
        </section>

        <section aria-labelledby="seccion-accesos" className={estilos.bloque}>
          <h2 id="seccion-accesos" className={estilos.seccionTitulo}>Accesos rápidos</h2>
          <div className={estilos.tarjetas}>
            <Link to={RUTAS.GESTION_DE_TORNEOS} className={estilos.tarjetaAccion}>
              <strong>Gestionar torneos</strong>
              <span>Crear, editar y abrir inscripciones.</span>
            </Link>
            <Link to={RUTAS.GESTION_DE_JUGADORES} className={estilos.tarjetaAccion}>
              <strong>Gestionar jugadores</strong>
              <span>Revisar integrantes y retirarlos de equipos.</span>
            </Link>
            <Link to={RUTAS.GESTION_DE_EQUIPOS} className={estilos.tarjetaAccion}>
              <strong>Gestionar equipos</strong>
              <span>Ver y eliminar equipos.</span>
            </Link>
            <Link to={RUTAS.GESTION_DE_INSCRIPCIONES} className={estilos.tarjetaAccion}>
              <strong>Gestionar inscripciones</strong>
              <span>Aprobar o rechazar equipos.</span>
            </Link>
            <Link to={RUTAS.GESTION_DE_PARTIDOS} className={estilos.tarjetaAccion}>
              <strong>Programar partidos</strong>
              <span>Asignar sede, cancha, fecha y hora.</span>
            </Link>
            <Link to={RUTAS.ADMIN_SEDES} className={estilos.tarjetaAccion}>
              <strong>Sedes y canchas</strong>
              <span>Administrar instalaciones y canchas.</span>
            </Link>
          </div>
        </section>
      </main>

      {usuarioActual.debeCambiarContrasena && (
        <ModalCambioObligatorioContrasena isOpen={true} />
      )}
    </div>
  );
}
