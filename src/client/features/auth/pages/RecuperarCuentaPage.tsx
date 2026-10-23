import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { MENSAJES_RECUPERACION } from '@shared/usuarios/contrato-recuperacion-cuenta';
import { normalizarCorreo } from '@shared/usuarios/reglas-registro-jugador';
import { ApiError } from '../../../common/api/client';
import { Aviso } from '../../../common/components/Aviso';
import { Boton } from '../../../common/components/Boton';
import { CampoDeTexto } from '../../../common/components/CampoDeTexto';
import { Escudo } from '../../../common/components/Escudo';
import { RUTAS, rutaRestablecerContrasena } from '../../../common/navegacion';
import { DisenoDeAcceso } from '../components/DisenoDeAcceso';
import { solicitarRecuperacionCuenta } from '../api';
import estilos from './RecuperarCuentaPage.module.css';

/**
 * v3 · Recuperación de cuenta con redirección directa (KAN-50).
 * Genera el enlace seguro de un solo uso en la misma pantalla para jugadores, capitanes y administradores.
 */
export function RecuperarCuentaPage() {
  const navegar = useNavigate();
  const [correo, setCorreo] = useState('');
  const [errorCorreo, setErrorCorreo] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [tokenGenerado, setTokenGenerado] = useState<string | null>(null);

  function validar(): boolean {
    const normalizado = normalizarCorreo(correo);
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!normalizado || !regexCorreo.test(normalizado)) {
      setErrorCorreo(MENSAJES_RECUPERACION.CORREO_INVALIDO);
      return false;
    }
    setErrorCorreo(null);
    return true;
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    if (!validar()) return;

    setEstaEnviando(true);
    setErrorGeneral(null);

    try {
      const respuesta = await solicitarRecuperacionCuenta(correo);
      setTokenGenerado(respuesta.token);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setErrorGeneral(MENSAJES_RECUPERACION.CORREO_NO_ENCONTRADO);
      } else {
        setErrorGeneral(
          error instanceof Error
            ? error.message
            : MENSAJES_RECUPERACION.CORREO_NO_ENCONTRADO,
        );
      }
    } finally {
      setEstaEnviando(false);
    }
  }

  function irARestablecer(): void {
    if (!tokenGenerado) return;
    void navegar(rutaRestablecerContrasena(tokenGenerado));
  }

  return (
    <DisenoDeAcceso fondoMovil="blanco" pestanaActiva="iniciar">
      <header className={estilos.encabezadoNeon}>
        <Escudo tamano={116} textoAlternativo="Escudo de Liga Bosque" />
        <p className={estilos.nombreDeLaLiga}>Liga Bosque</p>
        <p className={estilos.lemaDeLaLiga}>Fútbol 11 · Universidad El Bosque</p>
      </header>

      <form className={estilos.formulario} onSubmit={manejarEnvio} noValidate>
        <h1 className={estilos.titulo}>Recuperar cuenta</h1>
        <p className={estilos.descripcion}>
          Ingresa tu correo registrado para generar un enlace directo de restablecimiento de contraseña.
        </p>

        {errorGeneral && <Aviso tono="error">{errorGeneral}</Aviso>}

        {tokenGenerado ? (
          <div className={estilos.resultadoExito}>
            <p className={estilos.textoResultado}>
              ¡Enlace de recuperación generado con éxito!
            </p>
            <p className={estilos.descripcion}>
              Puedes acceder directamente al formulario de restablecimiento a continuación:
            </p>
            <Boton tipo="button" alPulsar={irARestablecer}>
              Ir a restablecer contraseña
            </Boton>
          </div>
        ) : (
          <>
            <CampoDeTexto
              id="correo-recuperacion"
              etiqueta="Correo institucional o registrado"
              tipo="email"
              valor={correo}
              alCambiar={(nuevo) => {
                setCorreo(nuevo);
                if (errorCorreo) setErrorCorreo(null);
                if (errorGeneral) setErrorGeneral(null);
              }}
              alSalir={validar}
              mensajeDeError={errorCorreo ?? undefined}
              autoCompletar="email"
            />

            <div className={estilos.acciones}>
              <Boton
                tipo="submit"
                estaDeshabilitado={estaEnviando || correo.trim().length === 0}
                estaCargando={estaEnviando}
              >
                {estaEnviando ? 'Generando enlace…' : 'Recuperar cuenta'}
              </Boton>
            </div>
          </>
        )}

        <p className={estilos.pie}>
          ¿Recordaste tu contraseña?{' '}
          <Link to={RUTAS.INICIAR_SESION} className={estilos.enlace}>
            Iniciar sesión
          </Link>
        </p>
      </form>
    </DisenoDeAcceso>
  );
}
