import { useEffect, useState } from 'react';
import { EncabezadoDeSeccion } from '../../../common/components/EncabezadoDeSeccion';
import estilos from './TablaDePosicionesVacia.module.css';

interface Fila { equipo: string; partidosJugados: number; puntos: number; }
export function TablaDePosicionesVacia() {
  const [filas, setFilas] = useState<Fila[]>([]);
  useEffect(() => { void fetch('/api/inscripciones').then((respuesta) => respuesta.json()).then(async (respuesta: { datos?: { torneoId: string; estado: string }[] }) => { const torneo = respuesta.datos?.find((actual) => actual.estado === 'APROBADA'); if (!torneo) return; const tabla = await fetch(`/api/tabla/${torneo.torneoId}`).then((resultado) => resultado.json()) as { datos?: Fila[] }; setFilas(tabla.datos ?? []); }); }, []);
  return <section aria-labelledby="inicio-tabla" className={estilos.seccion}><EncabezadoDeSeccion id="inicio-tabla" titulo="Tabla de posiciones" complemento={<span className={estilos.complemento}>{filas.length ? 'Torneo actual' : 'Sin torneo'}</span>} /><div className={estilos.tarjeta}>{filas.length === 0 ? <p className={estilos.mensaje}>Aún no hay equipos inscritos.</p> : <div>{filas.map((fila, indice) => <div className={estilos.fila} key={fila.equipo}><span>{indice + 1}</span><strong>{fila.equipo}</strong><span>{fila.partidosJugados}</span><span>{fila.puntos}</span></div>)}</div>}<p className={estilos.mensaje}>Los puntos se actualizarán cuando se registren resultados.</p></div></section>;
}
