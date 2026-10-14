import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { ModalGestionEquipo } from '../components/ModalGestionEquipo';
import estilos from './MisEquiposPage.module.css';

interface Equipo {
  id: string;
  nombre: string;
  color: string;
  capitanId?: string;
}

export function MisEquiposPage() {
  const { usuarioActual, estaComprobando } = useSesion();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equipoParaGestionar, setEquipoParaGestionar] = useState<Equipo | null>(null);

  useEffect(() => {
    if (usuarioActual) {
      void fetch('/api/equipos')
        .then((respuesta) => respuesta.json())
        .then((datos: { datos: Equipo[] }) => setEquipos(datos.datos ?? []))
        .catch(() => undefined);
    }
  }, [usuarioActual]);

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;

  async function salirDelEquipo(equipo: Equipo) {
    if (!window.confirm(`¿Salir de ${equipo.nombre}?`)) return;
    const respuesta = await fetch(`/api/equipos/${equipo.id}/integrantes`, { method: 'DELETE' });
    if (respuesta.ok) {
      setEquipos((actuales) => actuales.filter((actual) => actual.id !== equipo.id));
    }
  }

  return (
    <main className={estilos.pantalla}>
      <section className={estilos.contenido}>
        <header>
          <div>
            <p>Mi espacio</p>
            <h1>Mis equipos</h1>
          </div>
          <div className={estilos.acciones}>
            <Link className={estilos.botonClaro} to={RUTAS.UNIRME_A_UN_EQUIPO}>
              Unirme a equipo
            </Link>
            <Link className={estilos.boton} to={RUTAS.CREAR_MI_EQUIPO}>
              + Crear equipo
            </Link>
          </div>
        </header>

        {equipos.length === 0 ? (
          <div className={estilos.vacio}>
            <h2>Aún no tienes equipos</h2>
            <p>Crea uno para empezar a organizar tu plantilla.</p>
            <Link className={estilos.boton} to={RUTAS.CREAR_MI_EQUIPO}>
              Crear mi equipo
            </Link>
          </div>
        ) : (
          <div className={estilos.lista}>
            {equipos.map((equipo) => {
              const esCapitan = !equipo.capitanId || equipo.capitanId === usuarioActual.id;
              return (
                <article key={equipo.id}>
                  <span className={estilos.color} style={{ backgroundColor: equipo.color }} />
                  <div>
                    <h2>{equipo.nombre}</h2>
                    <p>
                      {esCapitan ? 'Capitán' : 'Jugador'} · {usuarioActual.nombreCompleto}
                    </p>
                  </div>
                  <div className={estilos.acciones}>
                    <button
                      type="button"
                      className={estilos.editar}
                      onClick={() => setEquipoParaGestionar(equipo)}
                    >
                      {esCapitan ? 'Editar' : 'Ver plantilla'}
                    </button>
                    <button
                      type="button"
                      className={estilos.salir}
                      onClick={() => void salirDelEquipo(equipo)}
                    >
                      Salir
                    </button>
                  </div>
                  <span className={estilos.estado}>Mi equipo</span>
                </article>
              );
            })}
          </div>
        )}

        {equipoParaGestionar && (
          <ModalGestionEquipo
            equipo={equipoParaGestionar}
            esCapitan={!equipoParaGestionar.capitanId || equipoParaGestionar.capitanId === usuarioActual.id}
            alCerrar={() => setEquipoParaGestionar(null)}
            alActualizarEquipo={(actualizado) => {
              setEquipos((actuales) =>
                actuales.map((e) =>
                  e.id === equipoParaGestionar.id ? { ...e, ...actualizado } : e,
                ),
              );
            }}
          />
        )}
      </section>
    </main>
  );
}
