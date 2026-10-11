import { Navigate } from 'react-router';
import { EstadoVacio } from '../../../common/components/EstadoVacio';
import { rutaDeInicioSegunRol, RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { ModalCambioObligatorioContrasena } from '../../auth/components/ModalCambioObligatorioContrasena';
import { EncabezadoAdmin } from '../components/EncabezadoAdmin';
import estilos from './GestionDeTorneosPage.module.css';

/**
 * v3 · A01 · Gestión de torneos. Destino del administrador al iniciar sesión (KAN-17, Escenario 2).
 * PROVISIONAL: el listado y el formulario de torneos llegan con su propia historia (épica E3).
 */
export function GestionDeTorneosPage() {
  const { usuarioActual, estaComprobando } = useSesion();

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  if (usuarioActual.rol !== 'admin') {
    return <Navigate to={rutaDeInicioSegunRol(usuarioActual.rol)} replace />;
  }

  return (
    <div className={estilos.pantalla}>
      <EncabezadoAdmin paginaActual="torneos" />
      <main className={estilos.contenido}>
        <p className={estilos.saludo}>Hola, {usuarioActual.nombreCompleto}</p>
        <h1 className={estilos.titulo}>Gestión de torneos</h1>
        <div className={estilos.tarjeta}>
          <EstadoVacio
            icono="copa"
            titulo="Esta pantalla llega con la historia de gestión de torneos"
            descripcion="Ya iniciaste sesión como administrador."
            centradoEnEscritorio
          />
        </div>
      </main>

      {usuarioActual.debeCambiarContrasena && (
        <ModalCambioObligatorioContrasena isOpen={true} />
      )}
    </div>
  );
}
