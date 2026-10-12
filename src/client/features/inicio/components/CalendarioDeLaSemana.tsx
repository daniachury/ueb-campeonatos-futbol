import { useEffect, useState } from 'react';
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
  const [partidos, setPartidos] = useState<{ id: string; fecha?: string; hora?: string; equipoLocal: string; equipoVisitante: string }[]>([]);
  useEffect(() => { void fetch('/api/inscripciones').then((respuesta) => respuesta.json()).then(async (respuesta: { datos?: { torneoId: string }[] }) => { const torneoId = respuesta.datos?.[0]?.torneoId; if (!torneoId) return; const calendario = await fetch(`/api/partidos/calendario/${torneoId}`).then((resultado) => resultado.json()) as { datos?: typeof partidos }; setPartidos(calendario.datos ?? []); }).catch(() => undefined); }, []);

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
              aria-label={`${dia.nombre} ${dia.numero}`}
              className={estaElegido ? `${estilos.dia} ${estilos.diaElegido}` : estilos.dia}
              onClick={() => setClaveDelDiaElegido(dia.clave)}
            >
              <span className={estilos.inicial}>{dia.inicial}</span>
              <span className={estilos.numero}>{dia.numero}</span>
            </button>
          );
        })}
      </div>
      {partidos.filter((partido) => partido.fecha === claveDelDiaElegido).length === 0 ? <EstadoVacio icono="calendario" borde="punteado" titulo="Sin fechas programadas" descripcion="Selecciona otro día para ver sus partidos." /> : <div className={estilos.partidos}>{partidos.filter((partido) => partido.fecha === claveDelDiaElegido).map((partido) => <div className={estilos.partido} key={partido.id}><strong>{partido.equipoLocal} vs {partido.equipoVisitante}</strong><span>{partido.fecha ?? 'Fecha pendiente'} · {partido.hora ?? 'Hora pendiente'}</span></div>)}</div>}
    </section>
  );
}
