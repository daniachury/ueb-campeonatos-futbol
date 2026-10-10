import { Link, useLocation, useNavigate } from 'react-router';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { MENSAJES_INICIO_DE_SESION } from '@shared/usuarios/reglas-inicio-de-sesion';
import { useServicios } from '../../../app/servicios';
import { Aviso } from '../../../common/components/Aviso';
import { Boton } from '../../../common/components/Boton';
import { CampoDeTexto } from '../../../common/components/CampoDeTexto';
import { Escudo } from '../../../common/components/Escudo';
import { Icono } from '../../../common/components/Icono';
import {
  RUTAS,
  rutaDeInicioSegunRol,
  type EstadoAlPedirInicioDeSesion,
} from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { DisenoDeAcceso } from '../components/DisenoDeAcceso';
import { useFormularioDeInicioDeSesion } from '../hooks/useFormularioDeInicioDeSesion';
import estilos from './IniciarSesionPage.module.css';

/** v3 · M01 · Iniciar sesión (móvil) y pestaña «Iniciar sesión» de W03 (escritorio) · KAN-17. */
export function IniciarSesionPage() {
  const { servicioDeSesion } = useServicios();
  const { establecerSesion, sesionExpiro } = useSesion();
  const navegar = useNavigate();
  const estadoRecibido = useLocation().state as EstadoAlPedirInicioDeSesion | null;

  function entrar(usuario: UsuarioAutenticado): void {
    establecerSesion(usuario);
    // Escenario 1 y 2: el jugador va a Torneos; el administrador, a Gestión de torneos.
    // Si llegó aquí desde una pantalla protegida, vuelve a ella. `replace` evita volver al formulario con Atrás.
    const destino =
      usuario.rol === 'jugador' && estadoRecibido?.desde
        ? estadoRecibido.desde
        : rutaDeInicioSegunRol(usuario.rol);
    void navegar(destino, { replace: true });
  }

  const formulario = useFormularioDeInicioDeSesion({ servicioDeSesion, alIniciarSesion: entrar });

  return (
    <DisenoDeAcceso fondoMovil="blanco" pestanaActiva="iniciar">
      <header className={estilos.encabezadoNeon}>
        <Escudo tamano={116} textoAlternativo="Escudo de Liga Bosque" />
        <p className={estilos.nombreDeLaLiga}>Liga Bosque</p>
        <p className={estilos.lemaDeLaLiga}>Fútbol 11 · Universidad El Bosque</p>
      </header>

      <form className={estilos.formulario} onSubmit={formulario.enviar} noValidate>
        <h1 className={estilos.titulo}>Hola de nuevo</h1>

        {sesionExpiro && (
          <Aviso tono="informativo">
            <Icono nombre="reloj" tamano={18} />
            {MENSAJES_INICIO_DE_SESION.sesionExpirada}
          </Aviso>
        )}
        {formulario.mensajeDeError && <Aviso tono="error">{formulario.mensajeDeError}</Aviso>}

        <CampoDeTexto
          {...formulario.conectarCampo('correo')}
          etiqueta="Correo"
          tipo="email"
          autoCompletar="email"
        />
        <CampoDeTexto
          {...formulario.conectarCampo('contrasena')}
          etiqueta="Contraseña"
          tipo="password"
          autoCompletar="current-password"
          permitirVerContrasena
        />

        <div className={estilos.acciones}>
          <Boton
            tipo="submit"
            estaDeshabilitado={!formulario.puedeEnviar}
            estaCargando={formulario.estaEnviando}
          >
            {formulario.estaEnviando ? 'Ingresando…' : 'Iniciar sesión'}
          </Boton>
        </div>

        <p className={estilos.pie}>
          ¿No tienes cuenta?{' '}
          <Link to={RUTAS.CREAR_CUENTA} className={estilos.enlace}>
            Crear cuenta
          </Link>
        </p>
      </form>
    </DisenoDeAcceso>
  );
}
