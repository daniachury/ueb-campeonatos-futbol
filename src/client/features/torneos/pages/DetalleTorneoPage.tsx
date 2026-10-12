import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useConsulta } from '../../../common/hooks/useConsulta';
import { formatearFecha } from '../../../common/lib/formato';
import { RUTAS } from '../../../common/navegacion';
import type { TorneoResumen } from '@shared/torneos';
import { ETIQUETAS_ESTADO_TORNEO } from '@shared/constants';
import estilos from './DetalleTorneoPage.module.css';
interface Equipo { id: string; nombre: string; }
interface Partido { id: string; jornada: number; fecha?: string; hora?: string; equipoLocal: string; equipoVisitante: string; sede?: string; cancha?: string; }

export function DetalleTorneoPage() {
  const { id } = useParams();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equipoId, setEquipoId] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [partidos, setPartidos] = useState<Partido[]>([]);
  useEffect(() => { if (torneoAbierto(id)) void fetch('/api/equipos').then((respuesta) => respuesta.json()).then((respuesta: { datos?: Equipo[] }) => setEquipos(respuesta.datos ?? [])); }, [id]);
  useEffect(() => { if (id) void fetch(`/api/partidos/calendario/${id}`).then((respuesta) => respuesta.json()).then((respuesta: { datos?: Partido[] }) => setPartidos(respuesta.datos ?? [])); }, [id]);
  const consulta = useConsulta(async () => {
    const respuesta = await fetch(`/api/torneos/${id}`);
    if (!respuesta.ok) throw new Error('No encontramos ese torneo');
    return ((await respuesta.json()) as { datos: TorneoResumen }).datos;
  }, [id]);

  if (consulta.tipo === 'cargando') return <p role="status">Cargando torneo…</p>;
  if (consulta.tipo === 'error') return <p role="alert">{consulta.mensaje}</p>;
  const torneo = consulta.datos as TorneoResumen & { descripcion?: string };
  async function inscribirEquipo() { const respuesta = await fetch('/api/inscripciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ torneoId: id, equipoId }) }); setMensaje(respuesta.ok ? 'Solicitud enviada.' : 'No se pudo enviar la solicitud.'); }
  return <main className={estilos.pantalla}><div className={estilos.contenido}><Link className={estilos.volver} to={RUTAS.TORNEOS}>← Volver a torneos</Link><section className={estilos.tarjeta}><div className={estilos.encabezado}><div><span className={estilos.eyebrow}>Liga Bosque · Fútbol 11</span><h1>{torneo.nombre}</h1></div><span className={estilos.estado}>{ETIQUETAS_ESTADO_TORNEO[torneo.estado]}</span></div><p className={estilos.descripcion}>{torneo.descripcion || 'Conoce todos los detalles de este torneo.'}</p><div className={estilos.datos}><div><span>Fecha de inicio</span><strong>{formatearFecha(torneo.fechaInicio)}</strong></div><div><span>Cupo máximo</span><strong>{torneo.cupo} equipos</strong></div><div><span>Formato</span><strong>Liga, una vuelta</strong></div></div>{partidos.length > 0 && <div className={estilos.calendario}><h2>Calendario</h2>{partidos.map((partido) => <div className={estilos.partido} key={partido.id}><strong>Jornada {partido.jornada}</strong><span>{partido.equipoLocal} vs {partido.equipoVisitante}</span><small>{partido.fecha ?? 'Fecha pendiente'} · {partido.hora ?? 'Hora pendiente'} · {partido.cancha ?? 'Cancha pendiente'}</small></div>)}</div>}{torneo.estado === 'INSCRIPCIONES_ABIERTAS' && <div className={estilos.inscripcion}><h2>Inscribir mi equipo</h2><select value={equipoId} onChange={(evento) => setEquipoId(evento.target.value)}><option value="">Selecciona un equipo</option>{equipos.map((equipo) => <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>)}</select><button disabled={!equipoId} onClick={() => void inscribirEquipo()}>Enviar solicitud</button>{mensaje && <p>{mensaje}</p>}</div>}<div className={estilos.accion}><a href={RUTAS.TORNEOS}>Ver otros torneos <span>→</span></a></div></section></div></main>;
}

function torneoAbierto(_id: string | undefined): boolean { return Boolean(_id); }
