import { useRef, useState, type FormEvent } from 'react';
import type { JugadorRegistrado } from '@shared/usuarios/contrato-registro-jugador';
import {
  CAMPOS_FORMULARIO_REGISTRO,
  VALORES_INICIALES_FORMULARIO_REGISTRO,
  esquemaSolicitudRegistroJugador,
  validarFormularioRegistro,
  type CampoFormularioRegistro,
  type ValoresFormularioRegistro,
} from '@shared/usuarios/esquema-registro-jugador';
import { REGLAS_CORREO, normalizarCorreo } from '@shared/usuarios/reglas-registro-jugador';
import type { PropiedadesCampoDeTexto } from '../../../common/components/CampoDeTexto';
import { ErrorCorreoYaRegistrado, type ServicioDeRegistro } from '../servicio-de-registro';

const MENSAJE_ERROR_INESPERADO =
  'No pudimos crear tu cuenta. Revisa tu conexión e intenta de nuevo.';

type PropiedadesConectadasAlCampo = Pick<
  PropiedadesCampoDeTexto,
  'id' | 'valor' | 'alCambiar' | 'alSalir' | 'mensajeDeError'
>;

interface OpcionesFormularioDeRegistro {
  servicioDeRegistro: ServicioDeRegistro;
  alRegistrarse: (jugador: JugadorRegistrado) => void;
}

/**
 * Toda la lógica del formulario Crear cuenta, separada de cómo se ve.
 * La pantalla solo dibuja lo que este hook le entrega.
 */
export function useFormularioDeRegistro({
  servicioDeRegistro,
  alRegistrarse,
}: OpcionesFormularioDeRegistro) {
  const [valores, setValores] = useState<ValoresFormularioRegistro>(
    VALORES_INICIALES_FORMULARIO_REGISTRO,
  );
  const [camposVisitados, setCamposVisitados] = useState<ReadonlySet<CampoFormularioRegistro>>(
    new Set(),
  );
  const [correoYaRegistrado, setCorreoYaRegistrado] = useState(false);
  const [errorInesperado, setErrorInesperado] = useState<string | null>(null);
  const [estaEnviando, setEstaEnviando] = useState(false);
  const hayUnEnvioEnCurso = useRef(false);

  const erroresDeValidacion = validarFormularioRegistro(valores);
  const formularioEsValido = Object.keys(erroresDeValidacion).length === 0;

  function obtenerErrorVisible(campo: CampoFormularioRegistro): string | undefined {
    if (campo === 'correo' && correoYaRegistrado) {
      return REGLAS_CORREO.mensajeYaRegistrado;
    }
    return camposVisitados.has(campo) ? erroresDeValidacion[campo] : undefined;
  }

  const cantidadDeCamposPorCorregir = CAMPOS_FORMULARIO_REGISTRO.filter(
    (campo) => camposVisitados.has(campo) && erroresDeValidacion[campo] !== undefined,
  ).length;

  /** v3 · M02: muestra cómo quedará guardado el correo (Escenario 1: "Laura@Mail.com " → "laura@mail.com"). */
  const correoNormalizado = normalizarCorreo(valores.correo);
  const correoComoSeGuardara =
    erroresDeValidacion.correo === undefined &&
    !correoYaRegistrado &&
    correoNormalizado !== valores.correo
      ? correoNormalizado
      : null;

  function cambiarValor(campo: CampoFormularioRegistro, nuevoValor: string): void {
    setValores((valoresAnteriores) => ({ ...valoresAnteriores, [campo]: nuevoValor }));
    setErrorInesperado(null);
    if (campo === 'correo') {
      setCorreoYaRegistrado(false);
    }
  }

  function marcarComoVisitado(campo: CampoFormularioRegistro): void {
    setCamposVisitados((camposAnteriores) => new Set(camposAnteriores).add(campo));
  }

  /** Entrega a un CampoDeTexto todo lo que necesita para quedar conectado al formulario. */
  function conectarCampo(campo: CampoFormularioRegistro): PropiedadesConectadasAlCampo {
    return {
      id: `registro-${campo}`,
      valor: valores[campo],
      alCambiar: (nuevoValor) => cambiarValor(campo, nuevoValor),
      alSalir: () => marcarComoVisitado(campo),
      mensajeDeError: obtenerErrorVisible(campo),
    };
  }

  async function registrarJugador(): Promise<void> {
    try {
      const solicitud = esquemaSolicitudRegistroJugador.parse(valores);
      const jugador = await servicioDeRegistro.registrarJugador(solicitud);
      alRegistrarse(jugador);
    } catch (error) {
      if (error instanceof ErrorCorreoYaRegistrado) {
        setCorreoYaRegistrado(true);
      } else {
        setErrorInesperado(MENSAJE_ERROR_INESPERADO);
      }
    } finally {
      hayUnEnvioEnCurso.current = false;
      setEstaEnviando(false);
    }
  }

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    if (hayUnEnvioEnCurso.current) {
      return; // Escenario 6: el segundo clic llega aquí y no hace nada.
    }

    setCamposVisitados(new Set(CAMPOS_FORMULARIO_REGISTRO));
    if (!formularioEsValido || correoYaRegistrado) {
      return;
    }

    hayUnEnvioEnCurso.current = true;
    setEstaEnviando(true);
    setErrorInesperado(null);
    void registrarJugador();
  }

  return {
    valores,
    estaEnviando,
    correoYaRegistrado,
    errorInesperado,
    puedeEnviar: formularioEsValido && !correoYaRegistrado && !estaEnviando,
    correoComoSeGuardara,
    mensajeDeAyudaDelBoton: describirLoQueFalta(
      cantidadDeCamposPorCorregir,
      formularioEsValido,
      correoYaRegistrado,
    ),
    conectarCampo,
    enviar,
  };
}

function describirLoQueFalta(
  cantidadDeCamposPorCorregir: number,
  formularioEsValido: boolean,
  correoYaRegistrado: boolean,
): string | null {
  if (cantidadDeCamposPorCorregir === 1) {
    return 'Corrige 1 campo para continuar';
  }
  if (cantidadDeCamposPorCorregir > 1) {
    return `Corrige ${cantidadDeCamposPorCorregir} campos para continuar`;
  }
  if (!formularioEsValido) {
    return 'Completa todos los campos para continuar';
  }
  if (correoYaRegistrado) {
    return 'Usa otro correo o inicia sesión';
  }
  return null;
}
