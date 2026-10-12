import { NavLink } from 'react-router';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { Avatar } from '../../common/components/Avatar';
import { Marca } from '../../common/components/Escudo';
import { Icono } from '../../common/components/Icono';
import { Insignia } from '../../common/components/Insignia';
import { MENU_DEL_JUGADOR } from '../../common/navegacion';
import estilos from './BarraLateral.module.css';

interface PropiedadesBarraLateral {
  jugador: UsuarioAutenticado;
  alCerrarSesion: () => void;
}

/** v3 · W04 · Barra lateral del jugador (solo escritorio). */
export function BarraLateral({ jugador, alCerrarSesion }: PropiedadesBarraLateral) {
  return (
    <aside className={estilos.barra}>
      <div className={estilos.marca}>
        <Marca />
      </div>

      <div className={estilos.jugador}>
        <Avatar nombreCompleto={jugador.nombreCompleto} tamano={40} />
        <div className={estilos.datosDelJugador}>
          <p className={estilos.nombre}>{jugador.nombreCompleto}</p>
          <Insignia>Jugador</Insignia>
        </div>
      </div>

      <nav aria-labelledby="barra-lateral-titulo" className={estilos.menu}>
        <p id="barra-lateral-titulo" className={estilos.tituloDelMenu}>
          Menú del jugador
        </p>
        {MENU_DEL_JUGADOR.map((opcion) => (
          <NavLink key={opcion.ruta} to={opcion.ruta} end className={estilos.opcion}>
            <Icono nombre={opcion.icono} />
            {opcion.ruta === '/inicio' ? 'Regresar al inicio' : opcion.texto}
          </NavLink>
        ))}
      </nav>

      <button type="button" className={estilos.cerrarSesion} onClick={alCerrarSesion}>
        <Icono nombre="salir" tamano={18} />
        Cerrar sesión
      </button>
    </aside>
  );
}
