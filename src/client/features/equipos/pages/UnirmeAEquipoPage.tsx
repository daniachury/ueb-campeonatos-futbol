import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './MisEquiposPage.module.css';

interface Equipo { id: string; nombre: string; color: string; cantidadIntegrantes: number; }

export function UnirmeAEquipoPage() {
  const { usuarioActual, estaComprobando } = useSesion();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  useEffect(() => { if (usuarioActual) void fetch('/api/equipos/disponibles').then((respuesta) => respuesta.json()).then((respuesta: { datos?: Equipo[] } | Equipo[]) => setEquipos(Array.isArray(respuesta) ? respuesta : respuesta.datos ?? [])); }, [usuarioActual]);
  async function unirme(id: string) { const respuesta = await fetch(`/api/equipos/${id}/integrantes`, { method: 'POST' }); if (respuesta.ok) setEquipos((actuales) => actuales.filter((equipo) => equipo.id !== id)); }
  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  return <main className={estilos.pantalla}><section className={estilos.contenido}><Link to={RUTAS.MIS_EQUIPOS}>← Mis equipos</Link><h1>Unirme a un equipo</h1><div className={estilos.lista}>{equipos.map((equipo) => <article key={equipo.id}><span className={estilos.color} style={{ backgroundColor: equipo.color }} /><div><h2>{equipo.nombre}</h2><p>{equipo.cantidadIntegrantes} integrantes</p></div><button className={estilos.editar} onClick={() => void unirme(equipo.id)}>Unirme</button></article>)}</div>{equipos.length === 0 && <p>No hay equipos disponibles.</p>}</section></main>;
}
