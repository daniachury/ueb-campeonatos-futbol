import { EncabezadoDeSeccion } from '../../../common/components/EncabezadoDeSeccion';
import estilos from './TablaDePosicionesVacia.module.css';

/** Anchos de las barras de relleno: dan forma de tabla sin inventar equipos (M11 muestra 3, W04 4). */
const FILAS_DE_RELLENO = ['70%', '55%', '62%', '48%'];

/** v3 · M11 / W04 · Tabla de posiciones sin torneo: la forma de la tabla y un mensaje. */
export function TablaDePosicionesVacia() {
  return (
    <section aria-labelledby="inicio-tabla" className={estilos.seccion}>
      <EncabezadoDeSeccion
        id="inicio-tabla"
        titulo="Tabla de posiciones"
        complemento={<span className={estilos.complemento}>Sin torneo</span>}
      />
      <div className={estilos.tarjeta}>
        <div aria-hidden="true">
          <div className={`${estilos.fila} ${estilos.filaDeTitulos}`}>
            <span>#</span>
            <span>Equipo</span>
            <span className={estilos.numero}>PJ</span>
            <span className={estilos.numero}>Pts</span>
          </div>
          {FILAS_DE_RELLENO.map((ancho) => (
            <div key={ancho} className={`${estilos.fila} ${estilos.filaVacia}`}>
              <span>—</span>
              <span className={estilos.equipoVacio}>
                <span className={estilos.escudoPunteado} />
                <span className={estilos.barraDeRelleno} style={{ width: ancho }} />
              </span>
              <span className={estilos.numero}>—</span>
              <span className={estilos.numero}>—</span>
            </div>
          ))}
        </div>
        <p className={estilos.mensaje}>
          Aún no hay posiciones. Tu equipo aparecerá aquí cuando juegue su primer torneo.
        </p>
      </div>
    </section>
  );
}
