import { Navigate, NavLink, Outlet } from 'react-router';
import { RUTAS } from '../../common/navegacion';
import { useSesionOpcional } from '../../common/sesion/ProveedorDeSesion';

/**
 * TODO(UEB-Proyect-01 · KAN-14): menú según el rol (jugador / administrador)
 * y menú hamburguesa en pantallas de menos de 768 px.
 */
const ENLACES = [{ ruta: '/torneos', texto: 'Torneos' }] as const;

export function AppLayout() {
  const sesion = useSesionOpcional();
  if (sesion?.usuarioActual?.rol === 'admin') {
    return <Navigate to={RUTAS.GESTION_DE_TORNEOS} replace />;
  }

  return (
    <div className="app">
      <header className="app__encabezado">
        <span className="app__marca">Campeonatos UEB</span>
        <nav aria-label="Principal">
          <ul className="app__menu">
            {ENLACES.map(({ ruta, texto }) => (
              <li key={ruta}>
                <NavLink
                  to={ruta}
                  className={({ isActive }) =>
                    isActive ? 'app__enlace app__enlace--activo' : 'app__enlace'
                  }
                >
                  {texto}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <NavLink className="app__enlace app__enlace--inicio" to={RUTAS.INICIO_DEL_JUGADOR}>
          Regresar al inicio
        </NavLink>
      </header>
      <main className="app__contenido">
        <Outlet />
      </main>
    </div>
  );
}
