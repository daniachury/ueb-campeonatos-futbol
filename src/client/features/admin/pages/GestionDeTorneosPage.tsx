import { Navigate, useNavigate } from 'react-router';
import { Boton } from '../../../common/components/Boton';
import { EstadoVacio } from '../../../common/components/EstadoVacio';
import { Marca } from '../../../common/components/Escudo';
import { RUTAS, rutaDeInicioSegunRol } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './GestionDeTorneosPage.module.css';

/**
 * v3 · A01 · Gestión de torneos. Destino del administrador al iniciar sesión (KAN-17, Escenario 2).
 * PROVISIONAL: el listado y el formulario de torneos llegan con su propia historia (épica E3).
 */
export function GestionDeTorneosPage() {
  const { usuarioActual, estaComprobando, cerrarSesion } = useSesion();
  const navegar = useNavigate();

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  if (usuarioActual.rol !== 'admin') {
    return <Navigate to={rutaDeInicioSegunRol(usuarioActual.rol)} replace />;
  }
  if (usuarioActual.debeCambiarContrasena) {
    return <Navigate to={RUTAS.CAMBIAR_CONTRASENA} replace />;
  }

  async function salirDeLaCuenta(): Promise<void> {
    await cerrarSesion();
    void navegar(RUTAS.INICIAR_SESION, { replace: true });
  }

  return (
    <div className={estilos.pantalla}>
      <header className={estilos.encabezado}>
        <Marca />
        <div className={estilos.cerrarSesion}>
          <Boton
            id="btn-ir-registrar-admin"
            variante="principal"
            tamano="mediano"
            anchoCompleto={false}
            alPulsar={() => void navegar(RUTAS.REGISTRAR_ADMIN)}
          >
            Registrar administrador
          </Boton>
          <Boton
            variante="secundario"
            tamano="mediano"
            anchoCompleto={false}
            alPulsar={() => void salirDeLaCuenta()}
          >
            Cerrar sesión
          </Boton>
        </div>
      </header>
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
    </div>
  );
}
