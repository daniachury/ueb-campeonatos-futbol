import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Boton } from '../../../common/components/Boton';
import { Marca } from '../../../common/components/Escudo';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './GestionDeEquiposPage.module.css';

interface Equipo { id: string; nombre: string; color: string; capitanNombre: string; cantidadIntegrantes: number; }

export function GestionSoloDeEquiposPage() {
  const { usuarioActual, estaComprobando } = useSesion();
  const navegar = useNavigate();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  useEffect(() => { if (usuarioActual?.rol === 'admin') void fetch('/api/admin/equipos').then((respuesta) => respuesta.json()).then((respuesta: { datos: Equipo[] }) => setEquipos(respuesta.datos)); }, [usuarioActual]);
  async function eliminar(equipo: Equipo) { if (!window.confirm(`¿Eliminar ${equipo.nombre}?`)) return; const respuesta = await fetch(`/api/admin/equipos/${equipo.id}`, { method: 'DELETE' }); if (respuesta.ok) setEquipos((actuales) => actuales.filter((actual) => actual.id !== equipo.id)); }
  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  if (usuarioActual.rol !== 'admin') return <Navigate to={RUTAS.INICIO_DEL_JUGADOR} replace />;
  return <main className={estilos.pantalla}><header className={estilos.encabezado}><Marca /><Boton variante="secundario" tamano="mediano" anchoCompleto={false} alPulsar={() => navegar(RUTAS.PANEL_ADMIN)}>Panel principal</Boton></header><section className={estilos.contenido}><button className={estilos.volver} onClick={() => navegar(RUTAS.PANEL_ADMIN)}>← Panel de administración</button><h1>Gestionar equipos</h1><p className={estilos.descripcion}>Consulta y elimina equipos.</p><div className={estilos.lista}>{equipos.map((equipo) => <article className={estilos.tarjeta} key={equipo.id}><div><h2>{equipo.nombre}</h2><p>{equipo.color} · {equipo.cantidadIntegrantes} integrantes</p><span>Capitán: {equipo.capitanNombre}</span></div><Boton variante="secundario" tamano="mediano" anchoCompleto={false} alPulsar={() => void eliminar(equipo)}>Eliminar</Boton></article>)}</div></section></main>;
}
