import { EnlaceBoton } from '../../../common/components/Boton';
import { RUTAS } from '../../../common/navegacion';
import estilos from './ProximoPartidoSinEquipo.module.css';

const DATOS_POR_DEFINIR = ['Fecha —', 'Hora —', 'Cancha —'];

/** Escudo punteado: el equipo todavía no existe. */
function EscudoVacio({ conSigno }: { conSigno: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={estilos.escudoVacio}>
      <path
        d="M12 2.6l7.4 2.8v5.6c0 5.1-3.3 8.7-7.4 10.3-4.1-1.6-7.4-5.2-7.4-10.3V5.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeDasharray="2.2 1.8"
      />
      {conSigno && (
        <path
          d="M12 9v5M9.5 11.5h5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/** v3 · M11 / W04 · «Tu próximo partido» de un jugador que aún no tiene equipo. */
export function ProximoPartidoSinEquipo() {
  return (
    <section aria-labelledby="inicio-proximo-partido" className={estilos.seccion}>
      <h2 id="inicio-proximo-partido" className={estilos.titulo}>
        Tu próximo partido
      </h2>
      <div className={estilos.tarjeta}>
        <span className={estilos.estado}>Sin partido programado</span>

        <div className={estilos.enfrentamiento}>
          <div className={estilos.equipo}>
            <EscudoVacio conSigno />
            <span className={estilos.nombreDelEquipo}>Sin equipo</span>
          </div>
          <span className={estilos.versus}>VS</span>
          <div className={estilos.equipo}>
            <EscudoVacio conSigno={false} />
            <span className={estilos.nombreDelEquipo}>Por definir</span>
          </div>
        </div>

        <ul className={estilos.datosDelPartido} aria-label="Datos del partido por definir">
          {DATOS_POR_DEFINIR.map((dato) => (
            <li key={dato} className={estilos.datoPorDefinir}>
              {dato}
            </li>
          ))}
        </ul>

        <div className={estilos.acciones}>
          <EnlaceBoton ruta={RUTAS.UNIRME_A_UN_EQUIPO} tamano="mediano" anchoCompleto={false}>
            Unirme a un equipo
          </EnlaceBoton>
          <EnlaceBoton
            ruta={RUTAS.CREAR_MI_EQUIPO}
            tamano="mediano"
            variante="blanco"
            anchoCompleto={false}
          >
            Crear mi equipo
          </EnlaceBoton>
        </div>
      </div>
    </section>
  );
}
