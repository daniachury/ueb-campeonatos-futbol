import { useLocation, useNavigate } from 'react-router';
import { Boton, EnlaceBoton } from '../../../common/components/Boton';
import { Marca } from '../../../common/components/Escudo';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './EncabezadoAdmin.module.css';

interface PropiedadesEncabezadoAdmin {
  paginaActual?: 'torneos' | 'sedes' | 'registrar' | 'perfil' | 'otro';
}

/**
 * Encabezado global y responsive para todas las pantallas del administrador.
 * Integra la navegación entre torneos, sedes, registro de admins y «Mi perfil» (KAN-19).
 */
export function EncabezadoAdmin({ paginaActual }: PropiedadesEncabezadoAdmin = {}) {
  const { cerrarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const rutaActual = ubicacion.pathname;
  const esPerfil = paginaActual === 'perfil' || rutaActual === RUTAS.MI_PERFIL;
  const esSedes = paginaActual === 'sedes' || rutaActual.startsWith(RUTAS.ADMIN_SEDES);
  const esTorneos =
    paginaActual === 'torneos' ||
    rutaActual === RUTAS.GESTION_DE_TORNEOS ||
    rutaActual === '/admin';

  async function salirDeLaCuenta(): Promise<void> {
    await cerrarSesion();
    void navegar(RUTAS.INICIAR_SESION, { replace: true });
  }

  return (
    <header className={estilos.encabezado} data-testid="encabezado-admin">
      <div className={estilos.marcaArea}>
        <Marca />
        <span className={estilos.insigniaAdmin}>Administrador</span>
      </div>

      <nav aria-label="Navegación de administrador" className={estilos.acciones}>
        <EnlaceBoton
          id="enlace-admin-torneos"
          ruta={RUTAS.GESTION_DE_TORNEOS}
          variante={esTorneos ? 'principal' : 'secundario'}
          tamano="mediano"
          anchoCompleto={false}
        >
          Torneos
        </EnlaceBoton>

        <EnlaceBoton
          id="enlace-admin-sedes"
          ruta={RUTAS.ADMIN_SEDES}
          variante={esSedes ? 'principal' : 'secundario'}
          tamano="mediano"
          anchoCompleto={false}
        >
          Sedes y canchas
        </EnlaceBoton>

        <Boton
          id="btn-ir-registrar-admin"
          variante="secundario"
          tamano="mediano"
          anchoCompleto={false}
          alPulsar={() => void navegar(RUTAS.REGISTRAR_ADMIN)}
        >
          Registrar admin
        </Boton>

        <EnlaceBoton
          id="btn-admin-perfil"
          ruta={RUTAS.MI_PERFIL}
          variante={esPerfil ? 'principal' : 'secundario'}
          tamano="mediano"
          anchoCompleto={false}
        >
          Mi perfil
        </EnlaceBoton>

        <Boton
          id="btn-cerrar-sesion"
          variante="secundario"
          tamano="mediano"
          anchoCompleto={false}
          alPulsar={() => void salirDeLaCuenta()}
        >
          Cerrar sesión
        </Boton>
      </nav>
    </header>
  );
}
