import { NavLink } from 'react-router';
import { Icono } from '../../common/components/Icono';
import { MENU_DEL_JUGADOR } from '../../common/navegacion';
import estilos from './NavegacionInferior.module.css';

/** v3 · M11 · Barra inferior de accesos rápidos (solo móvil). */
export function NavegacionInferior() {
  return (
    <nav aria-label="Accesos rápidos" className={estilos.barra}>
      {MENU_DEL_JUGADOR.map((opcion) => (
        <NavLink key={opcion.ruta} to={opcion.ruta} end className={estilos.opcion}>
          <span className={estilos.icono}>
            <Icono nombre={opcion.icono} />
          </span>
          {opcion.texto}
        </NavLink>
      ))}
    </nav>
  );
}
