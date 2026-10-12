import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { EncabezadoDeSeccion } from '../../../common/components/EncabezadoDeSeccion';
import { RUTAS } from '../../../common/navegacion';
import estilos from './MisTorneosVacio.module.css';

interface Torneo { id: string; torneoNombre: string; estado: string; equipoNombre: string; }

export function MisTorneosVacio() {
  const [torneos, setTorneos] = useState<Torneo[]>([]);
  const [filtro, setFiltro] = useState('Todos');
  useEffect(() => { void fetch('/api/inscripciones').then((respuesta) => respuesta.json()).then((respuesta: { datos?: Torneo[] }) => setTorneos(respuesta.datos ?? [])).catch(() => undefined); }, []);
  const visibles = filtro === 'Todos' ? torneos : torneos.filter((torneo) => filtro === 'En curso' ? torneo.estado === 'APROBADA' : filtro === 'Finalizados' ? torneo.estado === 'FINALIZADA' : torneo.estado === 'SOLICITADA');
  const mensajeVacio = filtro === 'Todos' ? 'Aún no participas en ningún torneo.' : filtro === 'Inscripciones abiertas' ? 'No tienes inscripciones abiertas' : filtro === 'En curso' ? 'No tienes torneos en curso' : 'No tienes torneos finalizados';
  return <section aria-labelledby="inicio-mis-torneos" className={estilos.seccion}><EncabezadoDeSeccion id="inicio-mis-torneos" titulo="Mis torneos" tamano="grande" complemento={<div className={estilos.filtros}>{['Todos', 'Inscripciones abiertas', 'En curso', 'Finalizados'].map((opcion) => <button className={filtro === opcion ? estilos.filtroActivo : estilos.filtro} key={opcion} onClick={() => setFiltro(opcion)}>{opcion}</button>)}</div>} /><div className={estilos.tarjeta}>{visibles.length === 0 ? <p className={estilos.mensaje}>{mensajeVacio}</p> : <div className={estilos.lista}>{visibles.map((torneo) => <Link className={estilos.torneo} to={`${RUTAS.TORNEOS}/${torneo.id}`} key={torneo.id}><strong>{torneo.torneoNombre}</strong><span>{torneo.equipoNombre} · {torneo.estado}</span></Link>)}</div>}</div></section>;
}
