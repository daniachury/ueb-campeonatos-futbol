import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useMenuDelJugador } from '../../../app/layout/LayoutDelJugador';
import { Avatar } from '../../../common/components/Avatar';
import { AvisoFlotante } from '../../../common/components/AvisoFlotante';
import { BotonIcono } from '../../../common/components/BotonIcono';
import { RUTAS, type EstadoAlLlegarAlInicio } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { CalendarioDeLaSemana } from '../components/CalendarioDeLaSemana';
import { MisTorneosVacio } from '../components/MisTorneosVacio';
import { PrimerosPasos } from '../components/PrimerosPasos';
import { ProximoPartidoSinEquipo } from '../components/ProximoPartidoSinEquipo';
import { TablaDePosicionesVacia } from '../components/TablaDePosicionesVacia';
import estilos from './InicioPage.module.css';

/**
 * v3 · M11 (móvil) y W04 (escritorio) · Inicio de un jugador nuevo.
 * Después de crear la cuenta (KAN-16, Escenario 1) el jugador llega aquí con la sesión
 * iniciada y el mensaje de bienvenida. Todavía no tiene equipo ni torneos: cada sección
 * muestra su estado vacío y el camino para empezar.
 */
export function InicioPage() {
  const { usuarioActual } = useSesion();
  const { abrirMenu } = useMenuDelJugador();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const estadoRecibido = ubicacion.state as EstadoAlLlegarAlInicio | null;
  const [mensajeDeBienvenida, setMensajeDeBienvenida] = useState(
    estadoRecibido?.mensajeDeBienvenida ?? null,
  );

  /** Lo quita también del historial, para que no vuelva a salir al recargar o ir atrás. */
  function cerrarBienvenida(): void {
    setMensajeDeBienvenida(null);
    void navegar(ubicacion.pathname, { replace: true, state: null });
  }

  // El layout ya garantiza la sesión; esta guarda solo satisface al tipo.
  if (!usuarioActual) return null;

  return (
    <div className={estilos.pagina}>
      <header className={estilos.encabezado}>
        <span className={estilos.botonDelMenu}>
          <BotonIcono
            icono="menu"
            etiqueta="Abrir menú"
            fondo="blanco"
            tamano={46}
            alPulsar={abrirMenu}
          />
        </span>
        <div className={estilos.saludo}>
          <p className={estilos.hola}>Hola,</p>
          <h1 className={estilos.nombre}>{usuarioActual.nombreCompleto}</h1>
        </div>
        <Link to={RUTAS.MI_PERFIL} aria-label="Mi perfil" className={estilos.enlaceAlPerfil}>
          <Avatar nombreCompleto={usuarioActual.nombreCompleto} tamano={46} />
        </Link>
        {mensajeDeBienvenida && (
          <div className={estilos.bienvenida}>
            <AvisoFlotante mensaje={mensajeDeBienvenida} alCerrar={cerrarBienvenida} />
          </div>
        )}
      </header>

      <div className={estilos.filaDestacada}>
        <ProximoPartidoSinEquipo />
        <PrimerosPasos />
      </div>

      <div className={estilos.fila}>
        <CalendarioDeLaSemana hoy={new Date()} />
        <TablaDePosicionesVacia />
      </div>

      <MisTorneosVacio />
    </div>
  );
}
