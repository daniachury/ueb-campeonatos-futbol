import { useRef, useState, type FormEvent } from 'react';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import {
  ErrorDeInicioDeSesion,
  type ServicioDeSesion,
} from '../../../common/sesion/servicio-de-sesion';
import type { PropiedadesCampoDeTexto } from '../../../common/components/CampoDeTexto';

const MENSAJE_ERROR_INESPERADO =
  'No pudimos iniciar tu sesión. Revisa tu conexión e intenta de nuevo.';

type CampoDeInicioDeSesion = 'correo' | 'contrasena';

type PropiedadesConectadasAlCampo = Pick<
  PropiedadesCampoDeTexto,
  'id' | 'valor' | 'alCambiar' | 'esInvalido'
>;

interface OpcionesFormularioDeInicioDeSesion {
  servicioDeSesion: ServicioDeSesion;
  alIniciarSesion: (usuario: UsuarioAutenticado) => void;
}

/**
 * Toda la lógica del formulario Iniciar sesión (KAN-17), separada de cómo se ve.
 * El error se muestra arriba del formulario y no dice si falló el correo o la contraseña.
 */
export function useFormularioDeInicioDeSesion({
  servicioDeSesion,
  alIniciarSesion,
}: OpcionesFormularioDeInicioDeSesion) {
  const [valores, setValores] = useState<Record<CampoDeInicioDeSesion, string>>({
    correo: '',
    contrasena: '',
  });
  const [mensajeDeError, setMensajeDeError] = useState<string | null>(null);
  /** Escenario 4: el correo quedó bloqueado; el botón se deshabilita hasta cambiar de correo. */
  const [estaBloqueado, setEstaBloqueado] = useState(false);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const hayUnEnvioEnCurso = useRef(false);

  const camposCompletos = valores.correo.trim() !== '' && valores.contrasena !== '';
  /** Solo las credenciales incorrectas pintan los dos campos en rojo (v3 · M01). */
  const credencialesRechazadas = mensajeDeError !== null && !estaBloqueado;

  function cambiarValor(campo: CampoDeInicioDeSesion, nuevoValor: string): void {
    setValores((valoresAnteriores) => ({ ...valoresAnteriores, [campo]: nuevoValor }));
    // El bloqueo es por correo: escribir otro correo permite intentar de nuevo.
    if (estaBloqueado && campo === 'contrasena') return;
    setEstaBloqueado(false);
    setMensajeDeError(null);
  }

  function conectarCampo(campo: CampoDeInicioDeSesion): PropiedadesConectadasAlCampo {
    return {
      id: `inicio-sesion-${campo}`,
      valor: valores[campo],
      alCambiar: (nuevoValor) => cambiarValor(campo, nuevoValor),
      esInvalido: credencialesRechazadas,
    };
  }

  async function iniciarSesion(): Promise<void> {
    try {
      const usuario = await servicioDeSesion.iniciarSesion({
        correo: valores.correo.trim().toLowerCase(),
        contrasena: valores.contrasena,
      });
      alIniciarSesion(usuario);
    } catch (error) {
      if (error instanceof ErrorDeInicioDeSesion) {
        setMensajeDeError(error.message);
        setEstaBloqueado(error.motivo === 'demasiados-intentos');
      } else {
        setMensajeDeError(MENSAJE_ERROR_INESPERADO);
      }
    } finally {
      hayUnEnvioEnCurso.current = false;
      setEstaEnviando(false);
    }
  }

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    if (hayUnEnvioEnCurso.current || !camposCompletos || estaBloqueado) return;

    hayUnEnvioEnCurso.current = true;
    setEstaEnviando(true);
    setMensajeDeError(null);
    void iniciarSesion();
  }

  return {
    mensajeDeError,
    estaEnviando,
    puedeEnviar: camposCompletos && !estaBloqueado && !estaEnviando,
    conectarCampo,
    enviar,
  };
}
