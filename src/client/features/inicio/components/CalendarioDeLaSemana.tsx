import { useState } from 'react';
import { EncabezadoDeSeccion } from '../../../common/components/EncabezadoDeSeccion';
import { EstadoVacio } from '../../../common/components/EstadoVacio';
import { convertirEnClave, describirRangoDeLaSemana, obtenerDiasDeLaSemana } from '../lib/semana';
import estilos from './CalendarioDeLaSemana.module.css';

interface PropiedadesCalendarioDeLaSemana {
  /** Día que se marca al abrir. Se recibe para que las pruebas fijen la fecha. */
  hoy: Date;
}

/** v3 · M11 / W04 · Semana actual sin partidos: el jugador todavía no tiene equipo. */
export function CalendarioDeLaSemana({ hoy }: PropiedadesCalendarioDeLaSemana) {
  const dias = obtenerDiasDeLaSemana(hoy);
  const [claveDelDiaElegido, setClaveDelDiaElegido] = useState(convertirEnClave(hoy));

  return (
    <section aria-labelledby="inicio-calendario" className={estilos.seccion}>
      <EncabezadoDeSeccion
        id="inicio-calendario"
        titulo="Calendario"
        complemento={
          <span className={estilos.rango}>
            <span className={estilos.soloEscritorio}>Semana del </span>
            {describirRangoDeLaSemana(dias)}
          </span>
        }
      />
      <div role="group" aria-label="Días de la semana" className={estilos.dias}>
        {dias.map((dia) => {
          const estaElegido = dia.clave === claveDelDiaElegido;
          return (
            <button
              key={dia.clave}
              type="button"
              aria-pressed={estaElegido}
              aria-label={`${dia.nombre} ${dia.numero}, sin partidos`}
              className={estaElegido ? `${estilos.dia} ${estilos.diaElegido}` : estilos.dia}
              onClick={() => setClaveDelDiaElegido(dia.clave)}
            >
              <span className={estilos.inicial}>{dia.inicial}</span>
              <span className={estilos.numero}>{dia.numero}</span>
            </button>
          );
        })}
      </div>
      <EstadoVacio
        icono="calendario"
        borde="punteado"
        titulo="Sin fechas programadas"
        descripcion="Aquí verás los partidos de tu equipo por fecha."
      />
    </section>
  );
}
