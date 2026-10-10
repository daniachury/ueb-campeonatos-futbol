import { useState, type ReactNode } from 'react';
import { Icono } from './Icono';
import estilos from './CampoDeTexto.module.css';

export interface PropiedadesCampoDeTexto {
  id: string;
  etiqueta: string;
  valor: string;
  alCambiar: (nuevoValor: string) => void;
  alSalir?: () => void;
  tipo?: 'text' | 'email' | 'tel' | 'password';
  autoCompletar?: string;
  /** Si llega, el campo se pinta en rojo y el mensaje aparece debajo. */
  mensajeDeError?: string | undefined;
  /** Pinta el campo en rojo sin mensaje propio: el error se muestra arriba del formulario (v3 · M01). */
  esInvalido?: boolean;
  /** Solo para contraseñas: agrega el botón del ojo para mostrarla u ocultarla (v3 · M01). */
  permitirVerContrasena?: boolean;
  /** Acción que acompaña al error, por ejemplo un enlace (v3 · M02, correo duplicado). */
  accionDelError?: ReactNode;
  /** Contenido entre la entrada y el error: un indicador, una aclaración… */
  ayuda?: ReactNode;
  /** Id del elemento de `ayuda`, para que el lector de pantalla lo lea al enfocar el campo. */
  idDeLaAyuda?: string | undefined;
}

/**
 * Campo de formulario genérico y accesible: etiqueta + entrada + ayuda + error.
 * No sabe nada del registro: sirve para cualquier formulario de la app.
 */
export function CampoDeTexto({
  id,
  etiqueta,
  valor,
  alCambiar,
  alSalir,
  tipo = 'text',
  autoCompletar,
  mensajeDeError,
  esInvalido = false,
  permitirVerContrasena = false,
  accionDelError,
  ayuda,
  idDeLaAyuda,
}: PropiedadesCampoDeTexto) {
  const [contrasenaVisible, setContrasenaVisible] = useState(false);
  const tieneMensajeDeError = mensajeDeError !== undefined;
  const tieneError = tieneMensajeDeError || esInvalido;
  const conBotonDeVer = tipo === 'password' && permitirVerContrasena;
  const tipoDeEntrada = conBotonDeVer && contrasenaVisible ? 'text' : tipo;
  const clasesDeLaEntrada = [
    estilos.entrada,
    tieneError && estilos.entradaConError,
    conBotonDeVer && estilos.entradaConBoton,
  ]
    .filter(Boolean)
    .join(' ');
  const idDelError = `${id}-error`;
  const idsQueDescribenElCampo = [idDeLaAyuda, tieneMensajeDeError ? idDelError : undefined]
    .filter((idDescriptivo) => idDescriptivo !== undefined)
    .join(' ');

  return (
    <div className={estilos.campo}>
      <label htmlFor={id} className={estilos.etiqueta}>
        {etiqueta}
      </label>
      <div className={estilos.contenedorDeLaEntrada}>
        <input
          id={id}
          name={id}
          type={tipoDeEntrada}
          value={valor}
          autoComplete={autoCompletar}
          onChange={(evento) => alCambiar(evento.target.value)}
          onBlur={alSalir}
          aria-invalid={tieneError}
          aria-describedby={idsQueDescribenElCampo || undefined}
          className={clasesDeLaEntrada}
        />
        {conBotonDeVer && (
          <button
            type="button"
            className={estilos.botonDeVer}
            aria-label={contrasenaVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={contrasenaVisible}
            onClick={() => setContrasenaVisible((visible) => !visible)}
          >
            <Icono nombre="ojo" />
          </button>
        )}
      </div>
      {ayuda}
      {tieneMensajeDeError && (
        <div id={idDelError} className={estilos.bloqueDeError}>
          <p className={estilos.mensajeDeError}>{mensajeDeError}</p>
          {accionDelError}
        </div>
      )}
    </div>
  );
}
