import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Boton } from '../../../common/components/Boton';
import { Marca } from '../../../common/components/Escudo';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './GestionDeEquiposPage.module.css';

interface Equipo { id: string; nombre: string; color: string; capitanNombre: string; cantidadIntegrantes: number; }
interface Integrante { id: string; nombreCompleto: string; }

export function GestionDeEquiposPage() {
  const { usuarioActual, estaComprobando } = useSesion();
  const navegar = useNavigate();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [integrantes, setIntegrantes] = useState<Record<string, Integrante[]>>({});
  useEffect(() => { if (usuarioActual?.rol === 'admin') void fetch('/api/admin/equipos').then((respuesta) => respuesta.json()).then((respuesta: { datos?: Equipo[] } | Equipo[]) => setEquipos(Array.isArray(respuesta) ? respuesta : respuesta.datos ?? [])); }, [usuarioActual]);
  async function verIntegrantes(id: string) { const respuesta = await fetch(`/api/admin/equipos/${id}/integrantes`); if (respuesta.ok) { const datos = await respuesta.json() as { datos: Integrante[] }; setIntegrantes((actuales) => ({ ...actuales, [id]: datos.datos })); } }
  async function retirar(equipoId: string, integrante: Integrante) { if (!window.confirm(`¿Retirar a ${integrante.nombreCompleto}?`)) return; const respuesta = await fetch(`/api/admin/equipos/${equipoId}/integrantes/${integrante.id}`, { method: 'DELETE' }); if (respuesta.ok) setIntegrantes((actuales) => ({ ...actuales, [equipoId]: actuales[equipoId].filter((actual) => actual.id !== integrante.id) })); }
  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  if (usuarioActual.rol !== 'admin') return <Navigate to={RUTAS.INICIO_DEL_JUGADOR} replace />;
  return <main className={estilos.pantalla}><header className={estilos.encabezado}><Marca /><Boton variante="secundario" tamano="mediano" anchoCompleto={false} alPulsar={() => navegar(RUTAS.PANEL_ADMIN)}>Panel principal</Boton></header><section className={estilos.contenido}><button className={estilos.volver} onClick={() => navegar(RUTAS.PANEL_ADMIN)}>← Panel de administración</button><h1>Gestionar integrantes</h1><p className={estilos.descripcion}>Revisa y retira jugadores de los equipos.</p><div className={estilos.lista}>{equipos.map((equipo) => <article className={estilos.tarjeta} key={equipo.id}><div><h2>{equipo.nombre}</h2><p>{equipo.color} · {equipo.cantidadIntegrantes} integrantes</p><span>Capitán: {equipo.capitanNombre}</span>{integrantes[equipo.id]?.map((integrante) => <div className={estilos.integrante} key={integrante.id}><span>{integrante.nombreCompleto}</span><Boton variante="secundario" tamano="mediano" anchoCompleto={false} alPulsar={() => void retirar(equipo.id, integrante)}>Retirar</Boton></div>)}</div><Boton tamano="mediano" anchoCompleto={false} alPulsar={() => void verIntegrantes(equipo.id)}>Ver integrantes</Boton></article>)}</div></section></main>;
}
