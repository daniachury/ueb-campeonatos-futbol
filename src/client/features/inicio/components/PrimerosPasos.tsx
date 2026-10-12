import { Link } from 'react-router';
import { EncabezadoDeSeccion } from '../../../common/components/EncabezadoDeSeccion';
import { Icono } from '../../../common/components/Icono';
import { RUTAS } from '../../../common/navegacion';
import estilos from './PrimerosPasos.module.css';

const PASOS_COMPLETADOS = 1;
const TOTAL_DE_PASOS = 3;

/** v3 · M11 / W04 · «Empieza en 3 pasos»: la cuenta ya existe, falta el equipo y el torneo. */
export function PrimerosPasos() {
  return (
    <section aria-labelledby="inicio-primeros-pasos" className={estilos.tarjeta}>
      <EncabezadoDeSeccion
        id="inicio-primeros-pasos"
        titulo="Empieza en 3 pasos"
        complemento={
          <span className={estilos.progresoEnTexto}>
            {PASOS_COMPLETADOS} de {TOTAL_DE_PASOS}
          </span>
        }
      />
      <div aria-hidden="true" className={estilos.barraDeProgreso}>
        <div
          className={estilos.avance}
          style={{ width: `${(PASOS_COMPLETADOS / TOTAL_DE_PASOS) * 100}%` }}
        />
      </div>

      <ol className={estilos.pasos}>
        <li className={`${estilos.paso} ${estilos.pasoCompletado}`}>
          <span className={`${estilos.marcador} ${estilos.marcadorCompletado}`}>
            <Icono nombre="confirmar" tamano={16} />
          </span>
          <span className={estilos.textos}>
            <span className={estilos.tituloTachado}>Crea tu cuenta</span>
            <span className={estilos.detalleCompletado}>Completado</span>
          </span>
        </li>
        <li>
          <Link to={RUTAS.UNIRME_A_UN_EQUIPO} className={estilos.paso}>
            <span className={`${estilos.marcador} ${estilos.marcadorActual}`}>2</span>
            <span className={estilos.textos}>
              <span className={estilos.tituloDelPaso}>Únete a un equipo o crea el tuyo</span>
              <span className={estilos.detalle}>Necesitas un equipo para jugar</span>
            </span>
            <Icono nombre="siguiente" tamano={16} />
          </Link>
        </li>
        <li>
          <Link to={RUTAS.TORNEOS} className={estilos.paso}>
            <span className={`${estilos.marcador} ${estilos.marcadorActual}`}>3</span>
            <span className={estilos.textos}>
              <span className={estilos.tituloDelPaso}>Juega tu primer torneo</span>
              <span className={estilos.detalle}>El capitán inscribe al equipo cuando hay cupos</span>
            </span>
            <Icono nombre="siguiente" tamano={16} />
          </Link>
        </li>
      </ol>
    </section>
  );
}
