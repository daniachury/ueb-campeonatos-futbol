import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { MENSAJES_RECUPERACION } from '@shared/usuarios/contrato-recuperacion-cuenta';
import { REGLAS_CONTRASENA } from '@shared/usuarios/reglas-registro-jugador';
import { ApiError } from '../../../common/api/client';
import { Aviso } from '../../../common/components/Aviso';
import { Boton } from '../../../common/components/Boton';
import { CampoDeTexto } from '../../../common/components/CampoDeTexto';
import { Escudo } from '../../../common/components/Escudo';
import { RUTAS } from '../../../common/navegacion';
import { DisenoDeAcceso } from '../components/DisenoDeAcceso';
import { restablecerContrasena, validarTokenRecuperacion } from '../api';
import estilos from './RestablecerContrasenaPage.module.css';

/**
 * v3 · Restablecimiento de contraseña con validación alfanumérica estricta (KAN-50).
 */
export function RestablecerContrasenaPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navegar = useNavigate();

  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [errorNueva, setErrorNueva] = useState<string | null>(null);
  const [errorConfirmar, setErrorConfirmar] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [estaComprobandoToken, setEstaComprobandoToken] = useState(true);
  const [tokenEsValido, setTokenEsValido] = useState(false);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [restablecidoConExito, setRestablecidoConExito] = useState(false);

  // Validación asíncrona del token al cargar la página
  useEffect(() => {
    let activo = true;

    async function verificarToken() {
      if (!token) {
        if (activo) {
          setEstaComprobandoToken(false);
          setTokenEsValido(false);
          setErrorGeneral(MENSAJES_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO);
        }
        return;
      }

      try {
        const respuesta = await validarTokenRecuperacion(token);
        if (activo) {
          if (respuesta.valido) {
            setTokenEsValido(true);
            setErrorGeneral(null);
          } else {
            setTokenEsValido(false);
            setErrorGeneral(
              respuesta.mensaje ?? MENSAJES_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO,
            );
          }
        }
      } catch (err) {
        if (activo) {
          setTokenEsValido(false);
          setErrorGeneral(
            err instanceof ApiError && err.status === 400
              ? MENSAJES_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO
              : MENSAJES_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO,
          );
        }
      } finally {
        if (activo) {
          setEstaComprobandoToken(false);
        }
      }
    }

    void verificarToken();

    return () => {
      activo = false;
    };
  }, [token]);

  function validarContrasena(): boolean {
    const {
      longitudMinima,
      patronAlMenosUnaLetra,
      patronAlMenosUnNumero,
      mensajeError,
      mensajeConfirmacionDistinta,
    } = REGLAS_CONTRASENA;

    let valida = true;

    if (
      nuevaContrasena.length < longitudMinima ||
      !patronAlMenosUnaLetra.test(nuevaContrasena) ||
      !patronAlMenosUnNumero.test(nuevaContrasena)
    ) {
      setErrorNueva(mensajeError);
      valida = false;
    } else {
      setErrorNueva(null);
    }

    if (confirmarContrasena !== nuevaContrasena) {
      setErrorConfirmar(mensajeConfirmacionDistinta);
      valida = false;
    } else {
      setErrorConfirmar(null);
    }

    return valida;
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    if (!validarContrasena()) return;

    setEstaEnviando(true);
    setErrorGeneral(null);

    try {
      await restablecerContrasena({
        token,
        nuevaContrasena,
        confirmarContrasena,
      });
      setRestablecidoConExito(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setErrorGeneral(MENSAJES_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO);
      } else {
        setErrorGeneral(
          err instanceof Error
            ? err.message
            : 'No se pudo restablecer la contraseña. Intenta nuevamente.',
        );
      }
    } finally {
      setEstaEnviando(false);
    }
  }

  return (
    <DisenoDeAcceso fondoMovil="blanco" pestanaActiva="iniciar">
      <header className={estilos.encabezadoNeon}>
        <Escudo tamano={116} textoAlternativo="Escudo de Liga Bosque" />
        <p className={estilos.nombreDeLaLiga}>Liga Bosque</p>
        <p className={estilos.lemaDeLaLiga}>Fútbol 11 · Universidad El Bosque</p>
      </header>

      <form className={estilos.formulario} onSubmit={manejarEnvio} noValidate>
        <h1 className={estilos.titulo}>Restablecer contraseña</h1>

        {errorGeneral && <Aviso tono="error">{errorGeneral}</Aviso>}

        {estaComprobandoToken ? (
          <p className={estilos.descripcion}>Verificando enlace de recuperación…</p>
        ) : restablecidoConExito ? (
          <div className={estilos.cajaExito}>
            <p className={estilos.textoExito}>
              {MENSAJES_RECUPERACION.EXITO_RESTABLECIMIENTO}
            </p>
            <p className={estilos.descripcion}>
              Tu contraseña fue actualizada correctamente y tus sesiones previas se han cerrado por seguridad.
            </p>
            <Boton
              tipo="button"
              alPulsar={() => {
                void navegar(RUTAS.INICIAR_SESION, { replace: true });
              }}
            >
              Iniciar sesión
            </Boton>
          </div>
        ) : !tokenEsValido ? (
          <div className={estilos.acciones}>
            <Boton
              tipo="button"
              alPulsar={() => {
                void navegar(RUTAS.RECUPERAR_CUENTA);
              }}
            >
              Solicitar nuevo enlace
            </Boton>
          </div>
        ) : (
          <>
            <p className={estilos.descripcion}>
              Define tu nueva contraseña de al menos 8 caracteres con letras y números.
            </p>

            <CampoDeTexto
              id="nueva-contrasena"
              etiqueta="Nueva contraseña"
              tipo="password"
              valor={nuevaContrasena}
              alCambiar={(v) => {
                setNuevaContrasena(v);
                if (errorNueva) setErrorNueva(null);
                if (errorGeneral) setErrorGeneral(null);
              }}
              alSalir={validarContrasena}
              mensajeDeError={errorNueva ?? undefined}
              permitirVerContrasena
              autoCompletar="new-password"
            />

            <CampoDeTexto
              id="confirmar-contrasena"
              etiqueta="Confirmar contraseña"
              tipo="password"
              valor={confirmarContrasena}
              alCambiar={(v) => {
                setConfirmarContrasena(v);
                if (errorConfirmar) setErrorConfirmar(null);
                if (errorGeneral) setErrorGeneral(null);
              }}
              alSalir={validarContrasena}
              mensajeDeError={errorConfirmar ?? undefined}
              permitirVerContrasena
              autoCompletar="new-password"
            />

            <div className={estilos.acciones}>
              <Boton
                tipo="submit"
                estaDeshabilitado={
                  estaEnviando ||
                  nuevaContrasena.trim().length === 0 ||
                  confirmarContrasena.trim().length === 0
                }
                estaCargando={estaEnviando}
              >
                {estaEnviando ? 'Guardando…' : 'Guardar nueva contraseña'}
              </Boton>
            </div>
          </>
        )}

        <p className={estilos.pie}>
          ¿Volver al inicio de sesión?{' '}
          <Link to={RUTAS.INICIAR_SESION} className={estilos.enlace}>
            Iniciar sesión
          </Link>
        </p>
      </form>
    </DisenoDeAcceso>
  );
}
