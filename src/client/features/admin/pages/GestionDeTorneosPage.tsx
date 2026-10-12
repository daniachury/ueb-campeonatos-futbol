import { useEffect, useState } from 'react';
import { Navigate, NavLink, useNavigate } from 'react-router';
import type { TorneoResumen } from '@shared/torneos';
import { Boton } from '../../../common/components/Boton';
import { Marca } from '../../../common/components/Escudo';
import { Avatar } from '../../../common/components/Avatar';
import { RUTAS, rutaDeInicioSegunRol } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './GestionDeTorneosPage.module.css';


export function GestionDeTorneosPage() {
  const [torneos, setTorneos] = useState<TorneoResumen[]>([]);
  const [mensaje, setMensaje] = useState('');
  const { usuarioActual, estaComprobando, cerrarSesion } = useSesion();
  const navegar = useNavigate();

  useEffect(() => {
    void fetch('/api/admin/torneos').then((respuesta) => respuesta.json()).then((datos: { datos: TorneoResumen[] }) => setTorneos(datos.datos)).catch(() => undefined);
  }, []);

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  if (usuarioActual.rol !== 'admin') {
    return <Navigate to={rutaDeInicioSegunRol(usuarioActual.rol)} replace />;
  }

  async function salirDeLaCuenta(): Promise<void> {
    await cerrarSesion();
    void navegar(RUTAS.INICIAR_SESION, { replace: true });
  }

  const guardar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const datos = Object.fromEntries(new FormData(evento.currentTarget));
    const respuesta = await fetch('/api/admin/torneos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...datos, cupo: Number(datos.cupo) }) });
    if (respuesta.ok) {
      evento.currentTarget.reset();
      setMensaje('Torneo guardado como borrador.');
      const datos = (await fetch('/api/admin/torneos').then((resultado) => resultado.json())) as { datos: TorneoResumen[] };
      setTorneos(datos.datos);
    }
  };

  async function abrirInscripciones(id: string): Promise<void> {
    if (!window.confirm('¿Quieres abrir las inscripciones? Este cambio no se puede deshacer.')) return;
    const respuesta = await fetch(`/api/admin/torneos/${id}/abrir-inscripciones`, { method: 'POST' });
    if (respuesta.ok) setTorneos((actuales) => actuales.map((torneo) => torneo.id === id ? { ...torneo, estado: 'INSCRIPCIONES_ABIERTAS' } : torneo));
  }

  async function generarFixture(torneo: TorneoResumen): Promise<void> {
    if (!window.confirm(`¿Cerrar inscripciones y generar el fixture de ${torneo.nombre}?`)) return;
    const respuesta = await fetch(`/api/admin/sorteo/${torneo.id}/generar`, { method: 'POST' });
    if (respuesta.ok) {
      setMensaje('Fixture generado. El torneo está en curso.');
      setTorneos((actuales) => actuales.map((actual) => actual.id === torneo.id ? { ...actual, estado: 'EN_CURSO' } : actual));
    } else setMensaje('No se pudo generar el fixture. Revisa que haya dos equipos aprobados.');
  }

  async function editarTorneo(torneo: TorneoResumen): Promise<void> {
    if (!['BORRADOR', 'INSCRIPCIONES_ABIERTAS'].includes(torneo.estado)) return;
    const nombre = window.prompt('Nombre del torneo', torneo.nombre);
    if (!nombre) return;
    const descripcion = window.prompt('Descripción del torneo', torneo.descripcion ?? '');
    if (descripcion === null) return;
    const fechaInicio = window.prompt('Fecha de inicio (AAAA-MM-DD)', torneo.fechaInicio);
    if (!fechaInicio) return;
    const cupoTexto = window.prompt('Cupo máximo de equipos (3 a 20)', String(torneo.cupo));
    if (!cupoTexto) return;
    const cupo = Number(cupoTexto);
    const respuesta = await fetch(`/api/admin/torneos/${torneo.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, descripcion, fechaInicio, cupo }) });
    if (respuesta.ok) {
      setMensaje('Torneo actualizado.');
      setTorneos((actuales) => actuales.map((actual) => actual.id === torneo.id ? { ...actual, nombre, descripcion, fechaInicio, cupo } : actual));
    }
  }

  async function eliminarTorneo(torneo: TorneoResumen): Promise<void> {
    if (!window.confirm(`¿Quieres eliminar ${torneo.nombre}?`)) return;
    const respuesta = await fetch(`/api/admin/torneos/${torneo.id}`, { method: 'DELETE' });
    if (respuesta.ok) {
      setMensaje('Torneo eliminado.');
      setTorneos((actuales) => actuales.filter((actual) => actual.id !== torneo.id));
    }
  }

  return (
    <div className={estilos.pantalla}>
      <header className={estilos.encabezado}>
        <div className={estilos.identidad}><Marca /><div><strong>Panel de administración</strong><span>{usuarioActual.nombreCompleto}</span></div></div>
        <nav className={estilos.menu} aria-label="Menú del administrador">
          <NavLink to={RUTAS.PANEL_ADMIN} end>← Inicio</NavLink>
          <NavLink to={RUTAS.GESTION_DE_TORNEOS} end>Torneos</NavLink>
          <NavLink to="#equipos">Equipos</NavLink>
          <NavLink to="#jugadores">Jugadores</NavLink>
        </nav>
        <div className={estilos.cerrarSesion}>
          <Avatar nombreCompleto={usuarioActual.nombreCompleto} tamano={40} />
          <Boton
            variante="secundario"
            tamano="mediano"
            anchoCompleto={false}
            alPulsar={() => void salirDeLaCuenta()}
          >
            Cerrar sesión
          </Boton>
        </div>
      </header>
      <main className={estilos.contenido}>
        <p className={estilos.saludo}>Hola, {usuarioActual.nombreCompleto}</p>
        <h1 className={estilos.titulo}>Gestión de torneos</h1>
        <div className={estilos.tarjeta}>
          <h2>Nuevo torneo</h2>
          <form className={estilos.formulario} onSubmit={(evento) => void guardar(evento)}>
            <label>Nombre<input name="nombre" minLength={3} maxLength={80} required /></label>
            <label>Descripción<textarea name="descripcion" maxLength={500} /></label>
            <div className={estilos.fijos}><span>Modalidad<strong>Fútbol 11</strong></span><span>Formato<strong>Liga, todos contra todos</strong></span></div>
            <label>Fecha de inicio<input name="fechaInicio" type="date" required /></label>
            <label>Cupo máximo<select name="cupo" defaultValue="8">{Array.from({ length: 18 }, (_, i) => <option key={i + 3}>{i + 3}</option>)}</select></label>
            <Boton tipo="submit">Guardar</Boton>
          </form>
          {mensaje && <p role="status">{mensaje}</p>}
          <h2>Torneos creados</h2>
          <div className={estilos.lista}>
            {torneos.map((torneo) => <article className={estilos.torneo} key={torneo.id}><div><strong>{torneo.nombre}</strong><span>{torneo.estado} · {torneo.cupo} equipos</span></div>{['BORRADOR', 'INSCRIPCIONES_ABIERTAS'].includes(torneo.estado) && <div className={estilos.acciones}><Boton variante="secundario" tamano="mediano" anchoCompleto={false} alPulsar={() => void editarTorneo(torneo)}>Editar</Boton><Boton variante="secundario" tamano="mediano" anchoCompleto={false} alPulsar={() => void eliminarTorneo(torneo)}>Eliminar</Boton>{torneo.estado === 'BORRADOR' && <Boton tamano="mediano" anchoCompleto={false} alPulsar={() => void abrirInscripciones(torneo.id)}>Abrir inscripciones</Boton>}{torneo.estado === 'INSCRIPCIONES_ABIERTAS' && <Boton tamano="mediano" anchoCompleto={false} alPulsar={() => void generarFixture(torneo)}>Generar fixture</Boton>}</div>}</article>)}
          </div>
        </div>
      </main>
    </div>
  );
}
