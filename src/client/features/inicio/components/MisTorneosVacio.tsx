import { useState } from 'react';
import { EncabezadoDeSeccion } from '../../../common/components/EncabezadoDeSeccion';
import { EstadoVacio } from '../../../common/components/EstadoVacio';
import estilos from './MisTorneosVacio.module.css';

/** Filtros de W04. Los títulos vacíos cambian con el filtro para que el mensaje sea exacto. */
const FILTROS_DE_MIS_TORNEOS = [
  { id: 'todos', texto: 'Todos', tituloVacio: 'Aún no participas en ningún torneo' },
  {
    id: 'inscripciones-abiertas',
    texto: 'Inscripciones abiertas',
    tituloVacio: 'No tienes inscripciones abiertas',
  },
  { id: 'en-curso', texto: 'En curso', tituloVacio: 'No tienes torneos en curso' },
  { id: 'finalizados', texto: 'Finalizados', tituloVacio: 'No tienes torneos finalizados' },
] as const;

type IdDelFiltro = (typeof FILTROS_DE_MIS_TORNEOS)[number]['id'];

/** v3 · M11 / W04 · «Mis torneos» de un jugador sin torneos. Los filtros son de escritorio. */
export function MisTorneosVacio() {
  const [idDelFiltro, setIdDelFiltro] = useState<IdDelFiltro>('todos');
  const filtroElegido =
    FILTROS_DE_MIS_TORNEOS.find((filtro) => filtro.id === idDelFiltro) ?? FILTROS_DE_MIS_TORNEOS[0];

  return (
    <section aria-labelledby="inicio-mis-torneos" className={estilos.seccion}>
      <EncabezadoDeSeccion
        id="inicio-mis-torneos"
        titulo="Mis torneos"
        tamano="grande"
        complemento={
          <div role="group" aria-label="Filtrar por estado" className={estilos.filtros}>
            {FILTROS_DE_MIS_TORNEOS.map((filtro) => (
              <button
                key={filtro.id}
                type="button"
                aria-pressed={filtro.id === idDelFiltro}
                className={estilos.filtro}
                onClick={() => setIdDelFiltro(filtro.id)}
              >
                {filtro.texto}
              </button>
            ))}
          </div>
        }
      />
      <div className={estilos.tarjeta}>
        <EstadoVacio
          icono="copa"
          titulo={filtroElegido.tituloVacio}
          descripcion="Cuando tu equipo se inscriba, aparecerá aquí con su estado y sus fechas."
          centradoEnEscritorio
        />
      </div>
    </section>
  );
}
