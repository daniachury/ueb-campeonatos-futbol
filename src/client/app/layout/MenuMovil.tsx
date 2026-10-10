import { useEffect, useRef, type KeyboardEvent } from 'react';
import { NavLink } from 'react-router';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { Avatar } from '../../common/components/Avatar';
import { BotonIcono } from '../../common/components/BotonIcono';
import { Marca } from '../../common/components/Escudo';
import { Icono } from '../../common/components/Icono';
import { Insignia } from '../../common/components/Insignia';
import { MENU_DEL_JUGADOR } from '../../common/navegacion';
import estilos from './MenuMovil.module.css';

interface PropiedadesMenuMovil {
  jugador: UsuarioAutenticado;
  alCerrar: () => void;
  alCerrarSesion: () => void;
}

/** v3 · M12 · Menú hamburguesa del jugador: pantalla neón completa (solo móvil). */
export function MenuMovil({ jugador, alCerrar, alCerrarSesion }: PropiedadesMenuMovil) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Al abrir, el foco entra al menú para que el teclado y el lector de pantalla sigan aquí.
  useEffect(() => {
    menuRef.current?.querySelector<HTMLElement>('button, a')?.focus();
  }, []);

  function cerrarConEscape(evento: KeyboardEvent<HTMLDivElement>): void {
    if (evento.key === 'Escape') alCerrar();
  }

  return (
    <div
      ref={menuRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menú del jugador"
      className={estilos.menu}
      onKeyDown={cerrarConEscape}
    >
      <header className={estilos.encabezado}>
        <Marca />
        <BotonIcono
          icono="cerrar"
          etiqueta="Cerrar menú"
          fondo="blanco"
          tamano={46}
          alPulsar={alCerrar}
        />
      </header>

      <div className={estilos.jugador}>
        <Avatar nombreCompleto={jugador.nombreCompleto} />
        <div className={estilos.datosDelJugador}>
          <p className={estilos.nombre}>{jugador.nombreCompleto}</p>
          <p className={estilos.correo}>{jugador.correo}</p>
        </div>
        <Insignia>Jugador</Insignia>
      </div>

      <nav aria-label="Menú principal">
        <ul className={estilos.opciones}>
          {MENU_DEL_JUGADOR.map((opcion) => (
            <li key={opcion.ruta}>
              <NavLink to={opcion.ruta} end className={estilos.opcion} onClick={alCerrar}>
                <Icono nombre={opcion.icono} tamano={26} className={estilos.iconoDeOpcion} />
                {opcion.texto}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button type="button" className={estilos.cerrarSesion} onClick={alCerrarSesion}>
        <Icono nombre="salir" />
        Cerrar sesión
      </button>
    </div>
  );
}
