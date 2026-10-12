import { Navigate, NavLink, useNavigate } from 'react-router';
import { Marca } from '../../../common/components/Escudo';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './PanelAdminPage.module.css';

export function PanelAdminPage() {
  const { usuarioActual, estaComprobando, cerrarSesion } = useSesion();
  const navegar = useNavigate();

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  if (usuarioActual.rol !== 'admin') return <Navigate to={RUTAS.INICIO_DEL_JUGADOR} replace />;

  async function salir(): Promise<void> {
    await cerrarSesion();
    void navegar(RUTAS.INICIAR_SESION, { replace: true });
  }

  return (
    <main className={estilos.pantalla}>
      <aside className={estilos.barra}><Marca /><div className={estilos.usuario}><strong>{usuarioActual.nombreCompleto}</strong><span>Administrador</span></div><nav><NavLink to={RUTAS.PANEL_ADMIN} end>Inicio</NavLink><NavLink to={RUTAS.GESTION_DE_TORNEOS}>Torneos</NavLink><NavLink to={RUTAS.GESTION_DE_EQUIPOS}>Equipos</NavLink><NavLink to={RUTAS.GESTION_DE_JUGADORES}>Jugadores</NavLink><NavLink to={RUTAS.GESTION_DE_INSCRIPCIONES}>Inscripciones</NavLink><NavLink to={RUTAS.GESTION_DE_PARTIDOS}>Partidos</NavLink></nav><button className={estilos.salir} onClick={() => void salir()}>Cerrar sesión</button></aside>
      <section className={estilos.contenido}>
        <p className={estilos.saludo}>Hola, {usuarioActual.nombreCompleto}</p>
        <h1>Panel de administración</h1>
        <p className={estilos.descripcion}>Organiza torneos, equipos, jugadores y partidos desde aquí.</p>
        <div className={estilos.resumen}><div><strong>6</strong><span>Torneos creados</span></div><div><strong>13</strong><span>Equipos registrados</span></div><div><strong>5</strong><span>Partidos generados</span></div></div>
        <h2>Accesos rápidos</h2>
        <div className={estilos.tarjetas}>
          <NavLink to={RUTAS.GESTION_DE_TORNEOS}><strong>Gestionar torneos</strong><span>Crear, editar y abrir inscripciones.</span></NavLink>
          <NavLink to={RUTAS.GESTION_DE_JUGADORES}><strong>Gestionar jugadores</strong><span>Revisar integrantes y retirarlos de equipos.</span></NavLink>
          <NavLink to={RUTAS.GESTION_DE_EQUIPOS}><strong>Gestionar equipos</strong><span>Ver y eliminar equipos.</span></NavLink>
          <NavLink to={RUTAS.GESTION_DE_INSCRIPCIONES}><strong>Gestionar inscripciones</strong><span>Aprobar o rechazar equipos.</span></NavLink>
          <NavLink to={RUTAS.GESTION_DE_PARTIDOS}><strong>Programar partidos</strong><span>Asignar sede, cancha, fecha y hora.</span></NavLink>
        </div>
      </section>
    </main>
  );
}
