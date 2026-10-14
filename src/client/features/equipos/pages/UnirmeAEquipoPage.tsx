import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import estilos from './MisEquiposPage.module.css';

interface Equipo {
  id: string;
  nombre: string;
  color: string;
  cantidadIntegrantes: number;
}

export function UnirmeAEquipoPage() {
  const { usuarioActual, estaComprobando } = useSesion();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [solicitados, setSolicitados] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    if (usuarioActual) {
      void fetch('/api/equipos/disponibles')
        .then((respuesta) => respuesta.json())
        .then((respuesta: { datos?: Equipo[] } | Equipo[]) =>
          setEquipos(Array.isArray(respuesta) ? respuesta : respuesta.datos ?? []),
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioActual?.id]);

  async function unirme(id: string) {
    setMensaje(null);
    const respuesta = await fetch(`/api/equipos/${id}/integrantes`, { method: 'POST' });
    if (respuesta.ok) {
      setEquipos((actuales) => actuales.filter((equipo) => equipo.id !== id));
    } else {
      const cuerpo = (await respuesta.json().catch(() => null)) as { mensaje?: string } | null;
      setMensaje({ tipo: 'error', texto: cuerpo?.mensaje ?? 'No fue posible unirte al equipo.' });
    }
  }

  async function solicitarIngreso(equipo: Equipo) {
    setMensaje(null);
    const respuesta = await fetch(`/api/equipos/${equipo.id}/solicitudes`, { method: 'POST' });
    if (respuesta.ok) {
      setSolicitados((actuales) => [...actuales, equipo.id]);
      setMensaje({
        tipo: 'exito',
        texto: `¡Solicitud de ingreso enviada al capitán de ${equipo.nombre}! Podrás ver el equipo cuando la apruebe.`,
      });
    } else {
      const cuerpo = (await respuesta.json().catch(() => null)) as { mensaje?: string } | null;
      setMensaje({
        tipo: 'error',
        texto: cuerpo?.mensaje ?? 'No se pudo enviar la solicitud al equipo.',
      });
    }
  }

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;

  return (
    <main className={estilos.pantalla}>
      <section className={estilos.contenido}>
        <header>
          <div>
            <Link to={RUTAS.MIS_EQUIPOS} className={estilos.botonClaro} style={{ marginBottom: 12 }}>
              ← Mis equipos
            </Link>
            <h1>Unirme a un equipo</h1>
            <p>Elige un equipo para integrarte o enviar tu solicitud al capitán.</p>
          </div>
        </header>

        {mensaje && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 16,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: 600,
              background: mensaje.tipo === 'exito' ? 'var(--color-tinte-acento, #f1fbd0)' : '#fcecec',
              color: mensaje.tipo === 'exito' ? 'var(--color-acento-texto, #3f5200)' : '#8f1f1f',
              border: `1px solid ${mensaje.tipo === 'exito' ? 'rgba(183, 240, 0, 0.4)' : '#d93a3a'}`,
            }}
            role={mensaje.tipo === 'error' ? 'alert' : 'status'}
          >
            {mensaje.texto}
          </div>
        )}

        <div className={estilos.lista}>
          {equipos.map((equipo) => {
            const yaSolicito = solicitados.includes(equipo.id);
            return (
              <article key={equipo.id}>
                <span className={estilos.color} style={{ backgroundColor: equipo.color }} />
                <div>
                  <h2>{equipo.nombre}</h2>
                  <p>{equipo.cantidadIntegrantes} integrantes</p>
                </div>
                <div className={estilos.acciones}>
                  {yaSolicito ? (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-acento-texto, #3f5200)' }}>
                      Solicitud enviada
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={estilos.editar}
                        onClick={() => void unirme(equipo.id)}
                      >
                        Unirme
                      </button>
                      <button
                        type="button"
                        className={estilos.salir}
                        onClick={() => void solicitarIngreso(equipo)}
                      >
                        Solicitar ingreso
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {equipos.length === 0 && <p className={estilos.vacio}>No hay equipos disponibles.</p>}
      </section>
    </main>
  );
}
