import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './CrearEquipoPage.module.css';

export function CrearEquipoPage() {
  const { usuarioActual, estaComprobando } = useSesion();
  const navegar = useNavigate();
  const [error, setError] = useState('');
  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    const respuesta = await fetch('/api/equipos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
    if (respuesta.ok) void navegar(RUTAS.MIS_EQUIPOS);
    else {
      const cuerpo = (await respuesta.json().catch(() => null)) as { mensaje?: string } | null;
      setError(cuerpo?.mensaje ?? 'No se pudo crear el equipo. Revisa los datos.');
    }
  }
  return <main className={estilos.pantalla}><section className={estilos.tarjeta}><Link to={RUTAS.MIS_EQUIPOS}>← Mis equipos</Link><h1>Crear equipo</h1><p>Serás el capitán de este equipo.</p><form onSubmit={(evento) => void guardar(evento)}><label>Nombre<input name="nombre" minLength={3} maxLength={60} required /></label><label>Color<input name="color" placeholder="Verde" maxLength={30} required /></label>{error && <p role="alert">{error}</p>}<button type="submit">Crear equipo</button></form></section></main>;
}
