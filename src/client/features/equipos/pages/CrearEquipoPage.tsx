import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './CrearEquipoPage.module.css';

interface JugadorInicial {
  nombreCompleto: string;
  correo: string;
}

export function CrearEquipoPage() {
  const { usuarioActual, estaComprobando } = useSesion();
  const navegar = useNavigate();
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('');

  const [nombreJugador, setNombreJugador] = useState('');
  const [correoJugador, setCorreoJugador] = useState('');
  const [jugadores, setJugadores] = useState<JugadorInicial[]>([]);

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;

  const agregarJugadorALista = () => {
    if (!nombreJugador.trim() || !correoJugador.trim()) return;

    if (jugadores.some((j) => j.correo.toLowerCase() === correoJugador.trim().toLowerCase())) {
      setError('Ese correo ya fue agregado a la lista de jugadores.');
      return;
    }

    setJugadores((actuales) => [
      ...actuales,
      { nombreCompleto: nombreJugador.trim(), correo: correoJugador.trim() },
    ]);
    setNombreJugador('');
    setCorreoJugador('');
    setError('');
  };

  const quitarJugadorDeLista = (correo: string) => {
    setJugadores((actuales) => actuales.filter((j) => j.correo !== correo));
  };

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError('');

    const cuerpo = {
      nombre: nombre.trim(),
      color: color.trim(),
      jugadores: jugadores.length > 0 ? jugadores : undefined,
    };

    const respuesta = await fetch('/api/equipos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });

    if (respuesta.ok) {
      void navegar(RUTAS.MIS_EQUIPOS);
    } else {
      const resJson = (await respuesta.json().catch(() => null)) as { mensaje?: string } | null;
      setError(resJson?.mensaje ?? 'No se pudo crear el equipo. Revisa los datos.');
    }
  }

  return (
    <main className={estilos.pantalla}>
      <section className={estilos.tarjeta}>
        <Link to={RUTAS.MIS_EQUIPOS} className={estilos.enlaceVolver}>
          ← Mis equipos
        </Link>
        <h1>Crear equipo</h1>
        <p className={estilos.subtitulo}>
          Serás el capitán de este equipo.
        </p>

        <form onSubmit={(evento) => void guardar(evento)} className={estilos.formulario}>
          <label>
            Nombre
            <input
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              minLength={3}
              maxLength={60}
              required
            />
          </label>

          <label>
            Color
            <input
              name="color"
              placeholder="Verde"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              maxLength={30}
              required
            />
          </label>

          <section className={estilos.seccionJugadores}>
            <h3>Plantilla inicial de jugadores (opcional)</h3>
            <p>
              Puedes agregar jugadores ahora o más adelante desde la edición de tu equipo (se requieren al menos 11 para torneos).
            </p>

            <div className={estilos.filaAgregarJugador}>
              <label>
                Jugador nuevo: datos
                <input
                  type="text"
                  placeholder="Nombre y apellido"
                  value={nombreJugador}
                  onChange={(e) => setNombreJugador(e.target.value)}
                />
              </label>

              <label>
                Jugador nuevo: correo
                <input
                  type="email"
                  placeholder="jugador@unbosque.edu.co"
                  value={correoJugador}
                  onChange={(e) => setCorreoJugador(e.target.value)}
                />
              </label>

              <button
                type="button"
                className={estilos.botonAgregarJugador}
                onClick={agregarJugadorALista}
              >
                + Añadir a la lista
              </button>
            </div>

            {jugadores.length > 0 && (
              <div className={estilos.listaJugadoresAgregados}>
                {jugadores.map((j) => (
                  <div key={j.correo} className={estilos.itemJugadorAgregado}>
                    <div className={estilos.datosJugadorAgregado}>
                      <span className={estilos.nombreJugadorAgregado}>{j.nombreCompleto}</span>
                      <span className={estilos.correoJugadorAgregado}>{j.correo}</span>
                    </div>
                    <button
                      type="button"
                      className={estilos.botonQuitarJugador}
                      onClick={() => quitarJugadorDeLista(j.correo)}
                    >
                      ✕ Quitar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {error && <p role="alert" className={estilos.alertaError}>{error}</p>}

          <button type="submit" className={estilos.botonPrincipal}>
            Crear equipo
          </button>
        </form>
      </section>
    </main>
  );
}
