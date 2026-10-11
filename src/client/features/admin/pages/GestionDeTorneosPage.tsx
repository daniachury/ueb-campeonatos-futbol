import { Navigate, useNavigate } from 'react-router';
import { Boton } from '../../../common/components/Boton';
import { Marca } from '../../../common/components/Escudo';
import { RUTAS, rutaDeInicioSegunRol } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './GestionDeTorneosPage.module.css';


export function GestionDeTorneosPage() {
  const { usuarioActual, estaComprobando, cerrarSesion } = useSesion();
  const navegar = useNavigate();

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
    if (respuesta.ok) evento.currentTarget.reset();
  };

  return (
    <div className={estilos.pantalla}>
      <header className={estilos.encabezado}>
        <Marca />
        <div className={estilos.cerrarSesion}>
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
            <Boton tipo="submit">Guardar como borrador</Boton>
          </form>
        </div>
      </main>
    </div>
  );
}
