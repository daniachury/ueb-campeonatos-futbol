import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Boton } from '../../../common/components/Boton';
import { Marca } from '../../../common/components/Escudo';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './GestionDeEquiposPage.module.css';

interface Inscripcion { id: string; estado: string; torneoNombre: string; equipoNombre: string; capitanNombre: string; }
export function GestionDeInscripcionesPage() {
  const { usuarioActual, estaComprobando } = useSesion(); const navegar = useNavigate(); const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  useEffect(() => { if (usuarioActual?.rol === 'admin') void fetch('/api/admin/inscripciones').then(async (respuesta) => { const datos = await respuesta.json() as { datos?: Inscripcion[] }; if (respuesta.ok && Array.isArray(datos.datos)) setInscripciones(datos.datos); }); }, [usuarioActual]);
  async function cambiarEstado(inscripcion: Inscripcion, estado: string) { const respuesta = await fetch(`/api/admin/inscripciones/${inscripcion.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) }); if (respuesta.ok) setInscripciones((actuales) => actuales.map((actual) => actual.id === inscripcion.id ? { ...actual, estado } : actual)); }
  if (estaComprobando) return null; if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />; if (usuarioActual.rol !== 'admin') return <Navigate to={RUTAS.INICIO_DEL_JUGADOR} replace />;
  return <main className={estilos.pantalla}><header className={estilos.encabezado}><Marca /><Boton variante="secundario" tamano="mediano" anchoCompleto={false} alPulsar={() => navegar(RUTAS.PANEL_ADMIN)}>Panel principal</Boton></header><section className={estilos.contenido}><button className={estilos.volver} onClick={() => navegar(RUTAS.PANEL_ADMIN)}>← Panel de administración</button><h1>Gestionar inscripciones</h1><div className={estilos.lista}>{inscripciones.map((inscripcion) => <article className={estilos.tarjeta} key={inscripcion.id}><div><h2>{inscripcion.equipoNombre}</h2><p>{inscripcion.torneoNombre} · {inscripcion.estado}</p><span>Capitán: {inscripcion.capitanNombre}</span></div>{inscripcion.estado === 'SOLICITADA' && <div className={estilos.acciones}><Boton tamano="mediano" anchoCompleto={false} alPulsar={() => void cambiarEstado(inscripcion, 'APROBADA')}>Aprobar</Boton><Boton variante="secundario" tamano="mediano" anchoCompleto={false} alPulsar={() => void cambiarEstado(inscripcion, 'RECHAZADA')}>Rechazar</Boton></div>}</article>)}</div></section></main>;
}
