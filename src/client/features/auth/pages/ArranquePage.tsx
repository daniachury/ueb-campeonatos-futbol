import { useNavigate } from 'react-router';
import { MENSAJES_INICIO_DE_SESION } from '@shared/usuarios/reglas-inicio-de-sesion';
import { Aviso } from '../../../common/components/Aviso';
import { Avatar } from '../../../common/components/Avatar';
import { EnlaceBoton } from '../../../common/components/Boton';
import { Escudo } from '../../../common/components/Escudo';
import { Icono } from '../../../common/components/Icono';
import { obtenerPrimerNombre } from '../../../common/lib/texto';
import { RUTAS, rutaDeInicioSegunRol } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { DisenoDeAcceso } from '../components/DisenoDeAcceso';
import estilos from './ArranquePage.module.css';

/**
 * v3 · S01 · SignIn (arranque y sesión). Primera pantalla de la app.
 * Pregunta al servidor por la cookie y muestra uno de cuatro estados:
 * comprobando, sesión activa, sin sesión o sesión expirada (KAN-17, Escenario 7).
 */
export function ArranquePage() {
  const { usuarioActual, estaComprobando, sesionExpiro, cerrarSesion } = useSesion();
  const navegar = useNavigate();

  async function usarOtraCuenta(): Promise<void> {
    await cerrarSesion();
    void navegar(RUTAS.INICIAR_SESION);
  }

  function dibujarEstadoDeLaSesion() {
    if (estaComprobando) {
      return (
        <div className={estilos.comprobando}>
          <p className={estilos.tituloDeSesion}>Comprobando tu sesión…</p>
          <div aria-hidden="true" className={estilos.barraDeCarga}>
            <div className={estilos.avanceDeCarga} />
          </div>
          <p className={estilos.textoSecundario}>Esto toma solo un momento.</p>
        </div>
      );
    }

    if (usuarioActual) {
      const primerNombre = obtenerPrimerNombre(usuarioActual.nombreCompleto);
      return (
        <>
          <div className={estilos.sesionActiva}>
            <Avatar nombreCompleto={usuarioActual.nombreCompleto} tono="naranja" />
            <div>
              <p className={estilos.textoSecundario}>Tu sesión sigue activa</p>
              <h1 className={estilos.tituloDeSesion}>Hola de nuevo, {primerNombre}</h1>
            </div>
          </div>
          <EnlaceBoton ruta={rutaDeInicioSegunRol(usuarioActual.rol)}>
            {usuarioActual.rol === 'admin' ? 'Entrar a Gestión de torneos' : 'Entrar a Torneos'}
          </EnlaceBoton>
          <p className={estilos.pieDeLaHoja}>
            ¿No eres {primerNombre}?{' '}
            <button
              type="button"
              className={estilos.enlaceEnLinea}
              onClick={() => void usarOtraCuenta()}
            >
              Usar otra cuenta
            </button>
          </p>
        </>
      );
    }

    if (sesionExpiro) {
      return (
        <>
          <Aviso tono="informativo">
            <Icono nombre="reloj" tamano={18} />
            {MENSAJES_INICIO_DE_SESION.sesionExpirada}
          </Aviso>
          <h1 className={estilos.titulo}>Hola de nuevo</h1>
          <p className={estilos.descripcion}>Por seguridad, la sesión dura 24 horas.</p>
          <div className={estilos.acciones}>
            <EnlaceBoton ruta={RUTAS.INICIAR_SESION}>Iniciar sesión</EnlaceBoton>
          </div>
        </>
      );
    }

    return (
      <>
        <h1 className={estilos.titulo}>Tu liga empieza aquí</h1>
        <p className={estilos.descripcion}>
          Inicia sesión para ver tus torneos, tu equipo y tus próximos partidos.
        </p>
        <div className={estilos.acciones}>
          <EnlaceBoton ruta={RUTAS.INICIAR_SESION}>Iniciar sesión</EnlaceBoton>
          <EnlaceBoton ruta={RUTAS.CREAR_CUENTA} variante="secundario">
            Soy nuevo · Crear cuenta
          </EnlaceBoton>
        </div>
      </>
    );
  }

  return (
    <DisenoDeAcceso fondoMovil="neon">
      <div className={estilos.portada}>
        <Escudo tamano={172} textoAlternativo="Escudo de Liga Bosque" />
        <p className={estilos.nombreDeLaLiga}>Liga Bosque</p>
        <p className={estilos.lemaDeLaLiga}>Fútbol 11 · Universidad El Bosque</p>
      </div>

      <section aria-live="polite" aria-busy={estaComprobando} className={estilos.hoja}>
        {dibujarEstadoDeLaSesion()}
      </section>
    </DisenoDeAcceso>
  );
}
