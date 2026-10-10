import { Link, useNavigate } from 'react-router';
import type { JugadorRegistrado } from '@shared/usuarios/contrato-registro-jugador';
import { useServicios } from '../../../app/servicios';
import { Aviso } from '../../../common/components/Aviso';
import { Boton } from '../../../common/components/Boton';
import { BotonIcono } from '../../../common/components/BotonIcono';
import { CampoDeTexto } from '../../../common/components/CampoDeTexto';
import { Escudo } from '../../../common/components/Escudo';
import { obtenerPrimerNombre } from '../../../common/lib/texto';
import { RUTAS, type EstadoAlLlegarAlInicio } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { DisenoDeAcceso } from '../components/DisenoDeAcceso';
import { IndicadorDeContrasena } from '../components/IndicadorDeContrasena';
import { useFormularioDeRegistro } from '../hooks/useFormularioDeRegistro';
import estilos from './CrearCuentaPage.module.css';

const ID_REGLAS_DE_CONTRASENA = 'registro-reglas-contrasena';
const ID_CORREO_COMO_SE_GUARDARA = 'registro-correo-normalizado';
const ID_AYUDA_DEL_BOTON = 'registro-ayuda-boton';

/** v3 · M02 · Crear cuenta (móvil) y pestaña «Crear cuenta» de W03 (escritorio) · KAN-16. */
export function CrearCuentaPage() {
  const { servicioDeRegistro } = useServicios();
  const { establecerSesion } = useSesion();
  const navegar = useNavigate();

  function entrarComoJugadorNuevo(jugador: JugadorRegistrado): void {
    establecerSesion(jugador);
    const estadoParaElInicio: EstadoAlLlegarAlInicio = {
      mensajeDeBienvenida: crearMensajeDeBienvenida(jugador.nombreCompleto),
    };
    void navegar(RUTAS.INICIO_DEL_JUGADOR, { state: estadoParaElInicio });
  }

  const formulario = useFormularioDeRegistro({
    servicioDeRegistro,
    alRegistrarse: entrarComoJugadorNuevo,
  });

  return (
    <DisenoDeAcceso fondoMovil="blanco" pestanaActiva="crear">
      <header className={estilos.encabezadoMovil}>
        <BotonIcono
          icono="volver"
          etiqueta="Volver a iniciar sesión"
          fondo="campo"
          ruta={RUTAS.INICIAR_SESION}
        />
        <Escudo tamano={40} />
      </header>

      <div className={estilos.cuerpo}>
        <div>
          <h1 className={estilos.titulo}>
            Crea tu ficha <br className={estilos.saltoSoloMovil} />
            de jugador
          </h1>
          <p className={estilos.subtitulo}>Después podrás crear un equipo o unirte a uno.</p>
        </div>

        <form className={estilos.formulario} onSubmit={formulario.enviar} noValidate>
          <CampoDeTexto
            {...formulario.conectarCampo('nombreCompleto')}
            etiqueta="Nombre completo"
            autoCompletar="name"
          />

          <div className={estilos.filaDeCampos}>
            <CampoDeTexto
              {...formulario.conectarCampo('correo')}
              etiqueta="Correo"
              tipo="email"
              autoCompletar="email"
              idDeLaAyuda={formulario.correoComoSeGuardara ? ID_CORREO_COMO_SE_GUARDARA : undefined}
              ayuda={
                formulario.correoComoSeGuardara && (
                  <p id={ID_CORREO_COMO_SE_GUARDARA} className={estilos.ayudaDelCampo}>
                    Se guardará como <strong>{formulario.correoComoSeGuardara}</strong>
                  </p>
                )
              }
              accionDelError={
                formulario.correoYaRegistrado && (
                  <Link to={RUTAS.INICIAR_SESION} className={estilos.enlace}>
                    ¿Olvidaste tu contraseña? Inicia sesión
                  </Link>
                )
              }
            />
            <CampoDeTexto
              {...formulario.conectarCampo('telefono')}
              etiqueta="Teléfono"
              tipo="tel"
              autoCompletar="tel"
            />
          </div>

          <div className={estilos.filaDeCampos}>
            <CampoDeTexto
              {...formulario.conectarCampo('contrasena')}
              etiqueta="Contraseña"
              tipo="password"
              autoCompletar="new-password"
              idDeLaAyuda={ID_REGLAS_DE_CONTRASENA}
              ayuda={
                <IndicadorDeContrasena
                  id={ID_REGLAS_DE_CONTRASENA}
                  contrasena={formulario.valores.contrasena}
                />
              }
            />
            <CampoDeTexto
              {...formulario.conectarCampo('confirmarContrasena')}
              etiqueta="Confirmar contraseña"
              tipo="password"
              autoCompletar="new-password"
            />
          </div>

          {formulario.errorInesperado && <Aviso tono="error">{formulario.errorInesperado}</Aviso>}

          <div className={estilos.acciones}>
            <Boton
              tipo="submit"
              estaDeshabilitado={!formulario.puedeEnviar}
              estaCargando={formulario.estaEnviando}
              idDeLaAyuda={formulario.mensajeDeAyudaDelBoton ? ID_AYUDA_DEL_BOTON : undefined}
            >
              {formulario.estaEnviando ? 'Creando…' : 'Crear cuenta'}
            </Boton>
            {formulario.mensajeDeAyudaDelBoton && (
              <p id={ID_AYUDA_DEL_BOTON} className={estilos.ayudaDelBoton}>
                {formulario.mensajeDeAyudaDelBoton}
              </p>
            )}
          </div>

          <p className={estilos.pie}>
            ¿Ya tienes cuenta?{' '}
            <Link to={RUTAS.INICIAR_SESION} className={estilos.enlace}>
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
    </DisenoDeAcceso>
  );
}

/** KAN-16 · Escenario 1: "¡Bienvenida, Laura! Tu cuenta fue creada". */
function crearMensajeDeBienvenida(nombreCompleto: string): string {
  return `¡Bienvenida, ${obtenerPrimerNombre(nombreCompleto)}! Tu cuenta fue creada`;
}
