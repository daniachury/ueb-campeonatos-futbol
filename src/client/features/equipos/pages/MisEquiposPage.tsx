import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './MisEquiposPage.module.css';

interface Equipo { id: string; nombre: string; color: string; }

export function MisEquiposPage() {
  const { usuarioActual, estaComprobando } = useSesion();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  useEffect(() => { if (usuarioActual) void fetch('/api/equipos').then((respuesta) => respuesta.json()).then((datos: { datos: Equipo[] }) => setEquipos(datos.datos)).catch(() => undefined); }, [usuarioActual]);
  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  async function editarEquipo(equipo: Equipo) {
    const nombre = window.prompt('Nombre del equipo', equipo.nombre)?.trim();
    if (!nombre) return;
    const color = window.prompt('Color del equipo', equipo.color)?.trim();
    if (!color) return;
    const respuesta = await fetch(`/api/equipos/${equipo.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, color }) });
    if (!respuesta.ok) { window.alert('No se pudo guardar el equipo.'); return; }
    setEquipos((actuales) => actuales.map((actual) => actual.id === equipo.id ? { ...actual, nombre, color } : actual));
  }
  async function salirDelEquipo(equipo: Equipo) { if (!window.confirm(`¿Salir de ${equipo.nombre}?`)) return; const respuesta = await fetch(`/api/equipos/${equipo.id}/integrantes`, { method: 'DELETE' }); if (respuesta.ok) setEquipos((actuales) => actuales.filter((actual) => actual.id !== equipo.id)); }
  return <main className={estilos.pantalla}><section className={estilos.contenido}><header><div><p>Mi espacio</p><h1>Mis equipos</h1></div><Link className={estilos.boton} to={RUTAS.CREAR_MI_EQUIPO}>+ Crear equipo</Link></header>{equipos.length === 0 ? <div className={estilos.vacio}><h2>Aún no tienes equipos</h2><p>Crea uno para empezar a organizar tu plantilla.</p><Link className={estilos.boton} to={RUTAS.CREAR_MI_EQUIPO}>Crear mi equipo</Link></div> : <div className={estilos.lista}>{equipos.map((equipo) => <article key={equipo.id}><span className={estilos.color} style={{ backgroundColor: equipo.color }} /><div><h2>{equipo.nombre}</h2><p>Capitán · {usuarioActual.nombreCompleto}</p></div><button className={estilos.editar} onClick={() => void editarEquipo(equipo)}>Editar</button><button className={estilos.salir} onClick={() => void salirDelEquipo(equipo)}>Salir</button><span className={estilos.estado}>Mi equipo</span></article>)}</div>}</section></main>;
}
