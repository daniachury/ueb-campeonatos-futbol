import { useEffect, useState, type ChangeEvent } from 'react';
import { Boton } from '../../../common/components/Boton';
import { REGLAS } from '@shared/constants';
import type { EquipoDisponibleParaInscripcion } from '@shared/inscripciones/contrato-inscripciones';
import { buscarEquiposDisponibles } from '../api/inscripciones-api';
import estilos from './PanelInscripcionDirecta.module.css';

interface PropiedadesPanelInscripcionDirecta {
  torneoId: string;
  cupoCompleto: boolean;
  torneoEnCurso: boolean;
  alInscribir: (equipoId: string) => Promise<void>;
}

export function PanelInscripcionDirecta({
  torneoId,
  cupoCompleto,
  torneoEnCurso,
  alInscribir,
}: PropiedadesPanelInscripcionDirecta) {
  const [busqueda, setBusqueda] = useState('');
  const [equipos, setEquipos] = useState<EquipoDisponibleParaInscripcion[]>([]);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [estaCargando, setEstaCargando] = useState(false);
  const [estaEnviando, setEstaEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    const temporizador = setTimeout(async () => {
      try {
        setEstaCargando(true);
        const resultados = await buscarEquiposDisponibles(torneoId, busqueda);
        if (activo) {
          const lista = Array.isArray(resultados) ? resultados : [];
          setEquipos(lista);
          // Si el seleccionado ya no está en la lista, deseleccionar
          if (seleccionado && !lista.some((e) => e.id === seleccionado)) {
            setSeleccionado(null);
          }
        }
      } catch (err) {
        console.error('Error buscando equipos disponibles', err);
      } finally {
        if (activo) setEstaCargando(false);
      }
    }, 200);

    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [torneoId, busqueda, seleccionado]);

  async function confirmarInscripcion() {
    if (!seleccionado || cupoCompleto || torneoEnCurso || estaEnviando) return;
    try {
      setEstaEnviando(true);
      await alInscribir(seleccionado);
      setSeleccionado(null);
      setBusqueda('');
    } finally {
      setEstaEnviando(false);
    }
  }

  const listaSegura = Array.isArray(equipos) ? equipos : [];
  const equipoSeleccionadoObj = listaSegura.find((e) => e.id === seleccionado);
  const plantillaIncompleta =
    equipoSeleccionadoObj &&
    equipoSeleccionadoObj.cantidadJugadores < REGLAS.JUGADORES_POR_EQUIPO_MIN;

  return (
    <section className={estilos.panel} aria-label="Inscribir directamente">
      <div className={estilos.encabezado}>
        <h3 className={estilos.titulo}>Inscribir equipo directamente</h3>
        <p className={estilos.descripcion}>
          Busca un equipo registrado para agregarlo de forma directa a la lista de aprobados.
        </p>
      </div>

      <div className={estilos.busqueda}>
        <input
          type="search"
          className={estilos.inputBusqueda}
          placeholder="Escribe el nombre del equipo..."
          value={busqueda}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
          disabled={cupoCompleto || torneoEnCurso}
          aria-label="Buscar equipo por nombre"
        />
      </div>

      <div className={estilos.listaEquipos} role="listbox" aria-label="Equipos disponibles">
        {estaCargando ? (
          <div className={estilos.vacio}>Buscando equipos...</div>
        ) : equipos.length === 0 ? (
          <div className={estilos.vacio}>
            {busqueda ? 'No se encontraron equipos disponibles con ese nombre.' : 'No hay más equipos disponibles.'}
          </div>
        ) : (
          equipos.map((equipo) => {
            const esIncompleto = equipo.cantidadJugadores < REGLAS.JUGADORES_POR_EQUIPO_MIN;
            const esSeleccionado = equipo.id === seleccionado;

            return (
              <div
                key={equipo.id}
                role="option"
                aria-selected={esSeleccionado}
                className={`${estilos.itemEquipo} ${esSeleccionado ? estilos.seleccionado : ''} ${
                  esIncompleto ? estilos.deshabilitado : ''
                }`}
                onClick={() => {
                  if (!esIncompleto) setSeleccionado(equipo.id);
                }}
              >
                <div className={estilos.infoEquipo}>
                  <span className={estilos.nombreEquipo}>{equipo.nombre}</span>
                  <span className={estilos.detallesEquipo}>
                    Capitán: {equipo.capitanNombre} · {equipo.cantidadJugadores} jugadores
                  </span>
                </div>
                {esIncompleto ? (
                  <span className={estilos.etiquetaIncompleto}>
                    {equipo.cantidadJugadores}/{REGLAS.JUGADORES_POR_EQUIPO_MIN} jugadores
                  </span>
                ) : (
                  <span className={estilos.etiquetaCompleto}>Listo</span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className={estilos.pie}>
        <Boton
          variante="principal"
          tamano="mediano"
          anchoCompleto={false}
          estaDeshabilitado={
            cupoCompleto ||
            torneoEnCurso ||
            !seleccionado ||
            Boolean(plantillaIncompleta) ||
            estaEnviando
          }
          estaCargando={estaEnviando}
          alPulsar={() => void confirmarInscripcion()}
        >
          {cupoCompleto
            ? 'Cupo completo'
            : torneoEnCurso
              ? 'Torneo en curso'
              : 'Inscribir equipo seleccionado'}
        </Boton>
      </div>
    </section>
  );
}
