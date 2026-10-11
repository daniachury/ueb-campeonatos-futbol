import { Link, Navigate } from 'react-router';
import { LayoutDelJugador } from '../../../app/layout/LayoutDelJugador';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { EncabezadoAdmin } from '../../admin/components/EncabezadoAdmin';
import { MiPerfilPage } from './MiPerfilPage';
import estilos from './RutaMiPerfil.module.css';

/**
 * Ruta inteligente para «Mi perfil» (KAN-19 · rol-todos).
 * Si el usuario es administrador, monta el perfil dentro del marco administrativo
 * con EncabezadoAdmin y enlace a torneos.
 * Si es jugador, se monta dentro de LayoutDelJugador con su barra lateral / navegación.
 */
export function RutaMiPerfil() {
  const { usuarioActual, estaComprobando } = useSesion();

  if (estaComprobando) return null;

  if (!usuarioActual) {
    return <Navigate to={RUTAS.INICIAR_SESION} replace state={{ desde: RUTAS.MI_PERFIL }} />;
  }

  if (usuarioActual.debeCambiarContrasena) {
    return <Navigate to={RUTAS.CAMBIAR_CONTRASENA} replace />;
  }

  if (usuarioActual.rol === 'admin') {
    return (
      <div className={estilos.pantallaAdmin} data-testid="pantalla-perfil-admin">
        <EncabezadoAdmin paginaActual="perfil" />
        <main className={estilos.contenidoAdmin}>
          <Link to={RUTAS.GESTION_DE_TORNEOS} className={estilos.enlaceVolver}>
            ← Volver a Gestión de torneos
          </Link>
          <MiPerfilPage />
        </main>
      </div>
    );
  }

  return (
    <LayoutDelJugador>
      <MiPerfilPage />
    </LayoutDelJugador>
  );
}
