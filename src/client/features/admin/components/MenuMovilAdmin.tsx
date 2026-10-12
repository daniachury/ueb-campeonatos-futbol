import { useEffect, useRef, type KeyboardEvent } from 'react';
import { NavLink } from 'react-router';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { Avatar } from '../../../common/components/Avatar';
import { BotonIcono } from '../../../common/components/BotonIcono';
import { Marca } from '../../../common/components/Escudo';
import { Icono, type NombreDeIcono } from '../../../common/components/Icono';
import { RUTAS } from '../../../common/navegacion';
import estilos from './MenuMovilAdmin.module.css';

interface OpcionAdmin {
  ruta: string;
  texto: string;
  icono: NombreDeIcono;
}

const OPCIONES_ADMIN: readonly OpcionAdmin[] = [
  { ruta: RUTAS.GESTION_DE_TORNEOS, texto: 'Torneos', icono: 'copa' },
  { ruta: RUTAS.ADMIN_SEDES, texto: 'Sedes y canchas', icono: 'calendario' },
  { ruta: RUTAS.REGISTRAR_ADMIN, texto: 'Registrar administrador', icono: 'perfil' },
  { ruta: RUTAS.MI_PERFIL, texto: 'Mi perfil', icono: 'perfil' },
];

interface PropiedadesMenuMovilAdmin {
  usuario: UsuarioAutenticado;
  alCerrar: () => void;
  alCerrarSesion: () => void;
}

/**
 * v3 · Menú hamburguesa del administrador (móvil).
 * Pantalla Neón completa con la misma estética que el menú del jugador (v3 · M12).
 */
export function MenuMovilAdmin({
  usuario,
  alCerrar,
  alCerrarSesion,
}: PropiedadesMenuMovilAdmin) {
  const menuRef = useRef<HTMLDivElement>(null);

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
      aria-label="Menú del administrador"
      className={estilos.menu}
      onKeyDown={cerrarConEscape}
      data-testid="menu-movil-admin"
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

      <div className={estilos.adminCard}>
        <Avatar nombreCompleto={usuario.nombreCompleto} />
        <div className={estilos.datosAdmin}>
          <p className={estilos.nombre}>{usuario.nombreCompleto}</p>
          <p className={estilos.correo}>{usuario.correo}</p>
        </div>
        <span className={estilos.insigniaAdmin}>Administrador</span>
      </div>

      <nav aria-label="Menú principal de administración">
        <ul className={estilos.opciones}>
          {OPCIONES_ADMIN.map((opcion) => (
            <li key={opcion.ruta}>
              <NavLink
                to={opcion.ruta}
                end
                className={({ isActive }) =>
                  `${estilos.opcion} ${isActive ? estilos.opcionActiva : ''}`
                }
                onClick={alCerrar}
              >
                <Icono nombre={opcion.icono} />
                {opcion.texto}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        className={estilos.cerrarSesion}
        onClick={alCerrarSesion}
      >
        <Icono nombre="salir" tamano={20} />
        Cerrar sesión
      </button>
    </div>
  );
}
