import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Boton, EnlaceBoton } from '../../../common/components/Boton';
import { BotonIcono } from '../../../common/components/BotonIcono';
import { Marca } from '../../../common/components/Escudo';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { MenuMovilAdmin } from './MenuMovilAdmin';
import estilos from './EncabezadoAdmin.module.css';

interface PropiedadesEncabezadoAdmin {
  paginaActual?: 'torneos' | 'sedes' | 'registrar' | 'perfil' | 'otro';
}

/**
 * Encabezado global y responsive para todas las pantallas del administrador.
 * En escritorio muestra la barra de navegación horizontal.
 * En móvil (< 768px) muestra el botón hamburguesa Neón idéntico al del jugador (v3 · M12).
 */
export function EncabezadoAdmin({ paginaActual }: PropiedadesEncabezadoAdmin = {}) {
  const { usuarioActual, cerrarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const rutaActual = ubicacion.pathname;
  const esPerfil = paginaActual === 'perfil' || rutaActual === RUTAS.MI_PERFIL;
  const esSedes = paginaActual === 'sedes' || rutaActual.startsWith(RUTAS.ADMIN_SEDES);
  const esTorneos =
    paginaActual === 'torneos' ||
    rutaActual === RUTAS.GESTION_DE_TORNEOS ||
    rutaActual === '/admin';

  async function salirDeLaCuenta(): Promise<void> {
    setMenuMovilAbierto(false);
    await cerrarSesion();
    void navegar(RUTAS.INICIAR_SESION, { replace: true });
  }

  return (
    <>
      <header className={estilos.encabezado} data-testid="encabezado-admin">
        <div className={estilos.marcaArea}>
          <Marca />
          <span className={estilos.insigniaAdmin}>Administrador</span>
        </div>

        {/* Navegación para escritorio (>= 768px) */}
        <nav
          aria-label="Navegación de administrador"
          className={estilos.accionesDesktop}
          data-testid="acciones-admin-desktop"
        >
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

        {/* Botón menú hamburguesa para móvil (< 768px) */}
        <div className={estilos.botonHamburguesa}>
          <BotonIcono
            icono="menu"
            etiqueta="Abrir menú de administrador"
            fondo="blanco"
            tamano={44}
            alPulsar={() => setMenuMovilAbierto(true)}
          />
        </div>
      </header>

      {/* Menú a pantalla completa Neón cuando está abierto en móvil */}
      {menuMovilAbierto && usuarioActual && (
        <MenuMovilAdmin
          usuario={usuarioActual}
          alCerrar={() => setMenuMovilAbierto(false)}
          alCerrarSesion={() => void salirDeLaCuenta()}
        />
      )}
    </>
  );
}
