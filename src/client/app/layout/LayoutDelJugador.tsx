import { createContext, useContext, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import {
  RUTAS,
  rutaDeInicioSegunRol,
  type EstadoAlPedirInicioDeSesion,
} from '../../common/navegacion';
import { useSesion } from '../../common/sesion/ProveedorDeSesion';
import { BarraLateral } from './BarraLateral';
import { MenuMovil } from './MenuMovil';
import { NavegacionInferior } from './NavegacionInferior';
import estilos from './LayoutDelJugador.module.css';

interface MenuDelJugador {
  abrirMenu: () => void;
}

const ContextoDelMenu = createContext<MenuDelJugador | null>(null);

interface PropiedadesLayoutDelJugador {
  children?: React.ReactNode;
}

/**
 * Marco de todas las pantallas del jugador con sesión (v3 · M11, M12 y W04).
 * - Móvil: barra inferior fija y menú hamburguesa a pantalla completa.
 * - Escritorio: barra lateral con el menú, el jugador y «Cerrar sesión».
 * Sin sesión va a Iniciar sesión y, al entrar, vuelve aquí (KAN-17).
 */
export function LayoutDelJugador({ children }: PropiedadesLayoutDelJugador = {}) {
  const { usuarioActual, estaComprobando, cerrarSesion } = useSesion();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const [menuEstaAbierto, setMenuEstaAbierto] = useState(false);
  const menuDelJugador = useMemo<MenuDelJugador>(
    () => ({ abrirMenu: () => setMenuEstaAbierto(true) }),
    [],
  );

  // Mientras se revisa la cookie no se dibuja nada: evita mostrar datos o redirigir antes de tiempo.
  if (estaComprobando) return null;

  if (!usuarioActual) {
    const estadoParaIniciarSesion: EstadoAlPedirInicioDeSesion = { desde: ubicacion.pathname };
    return <Navigate to={RUTAS.INICIAR_SESION} replace state={estadoParaIniciarSesion} />;
  }
  if (usuarioActual.rol !== 'jugador') {
    return <Navigate to={rutaDeInicioSegunRol(usuarioActual.rol)} replace />;
  }

  /** KAN-17 · Escenario 6: invalida el token y vuelve a Iniciar sesión sin dejar esta pantalla en el historial. */
  async function salirDeLaCuenta(): Promise<void> {
    setMenuEstaAbierto(false);
    await cerrarSesion();
    void navegar(RUTAS.INICIAR_SESION, { replace: true });
  }

  return (
    <ContextoDelMenu.Provider value={menuDelJugador}>
      <div className={estilos.pantalla}>
        <BarraLateral jugador={usuarioActual} alCerrarSesion={() => void salirDeLaCuenta()} />
        <div className={estilos.contenido}>
          {children ?? <Outlet />}
        </div>
        <NavegacionInferior />
        {menuEstaAbierto && (
          <MenuMovil
            jugador={usuarioActual}
            alCerrar={() => setMenuEstaAbierto(false)}
            alCerrarSesion={() => void salirDeLaCuenta()}
          />
        )}
      </div>
    </ContextoDelMenu.Provider>
  );
}

/** Permite que el encabezado de cada pantalla abra el menú hamburguesa. */
export function useMenuDelJugador(): MenuDelJugador {
  const menu = useContext(ContextoDelMenu);
  if (menu === null) {
    throw new Error('useMenuDelJugador debe usarse dentro de <LayoutDelJugador>');
  }
  return menu;
}
