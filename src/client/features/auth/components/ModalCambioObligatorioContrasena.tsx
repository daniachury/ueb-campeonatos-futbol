import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { REGLAS_CONTRASENA } from '@shared/usuarios/reglas-registro-jugador';
import { ApiError } from '../../../common/api/client';
import { Aviso } from '../../../common/components/Aviso';
import { Boton } from '../../../common/components/Boton';
import { CampoDeTexto } from '../../../common/components/CampoDeTexto';
import { Escudo } from '../../../common/components/Escudo';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { cambiarContrasena } from '../../admin/api';
import estilos from './ModalCambioObligatorioContrasena.module.css';

interface PropiedadesModalCambioObligatorioContrasena {
  isOpen: boolean;
  onContrasenaCambiada?: () => void;
}

/**
 * Modal responsive para el cambio obligatorio de contraseña en el primer ingreso (KAN-18 / KAN-43).
 * Bloquea la navegación hasta que el administrador actualiza su contraseña temporal.
 */
export function ModalCambioObligatorioContrasena({
  isOpen,
  onContrasenaCambiada,
}: PropiedadesModalCambioObligatorioContrasena) {
  const { usuarioActual, establecerSesion, cerrarSesion } = useSesion();
  const navegar = useNavigate();

  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensajeGeneral, setMensajeGeneral] = useState<string | null>(null);
  const [estaEnviando, setEstaEnviando] = useState(false);

  if (!isOpen || !usuarioActual) return null;

  function validar(): boolean {
    const nuevosErrores: Record<string, string> = {};

    if (!contrasenaActual) {
      nuevosErrores.contrasenaActual = 'Ingresa tu contraseña actual';
    }

    const {
      longitudMinima,
      patronAlMenosUnaLetra,
      patronAlMenosUnNumero,
      mensajeError,
      mensajeConfirmacionDistinta,
    } = REGLAS_CONTRASENA;

    if (
      contrasenaNueva.length < longitudMinima ||
      !patronAlMenosUnaLetra.test(contrasenaNueva) ||
      !patronAlMenosUnNumero.test(contrasenaNueva)
    ) {
      nuevosErrores.contrasenaNueva = mensajeError;
    } else if (contrasenaNueva === contrasenaActual) {
      nuevosErrores.contrasenaNueva = 'La nueva contraseña debe ser diferente a la actual';
    }

    if (confirmarContrasena !== contrasenaNueva) {
      nuevosErrores.confirmarContrasena = mensajeConfirmacionDistinta;
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function manejarEnvio(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!validar() || estaEnviando) return;

    setEstaEnviando(true);
    setMensajeGeneral(null);

    try {
      await cambiarContrasena({
        contrasenaActual,
        contrasenaNueva,
      });

      // Actualizar la sesión global indicando que ya no debe cambiarla
      establecerSesion({
        ...usuarioActual!,
        debeCambiarContrasena: false,
      });

      if (onContrasenaCambiada) {
        onContrasenaCambiada();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setMensajeGeneral(error.message);
      } else {
        setMensajeGeneral('Ocurrió un error inesperado al actualizar la contraseña');
      }
    } finally {
      setEstaEnviando(false);
    }
  }

  async function salir(): Promise<void> {
    await cerrarSesion();
    void navegar(RUTAS.INICIAR_SESION, { replace: true });
  }

  return (
    <div
      className={estilos.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cambio-titulo"
      data-testid="modal-cambio-obligatorio-contrasena"
    >
      <div className={estilos.tarjetaModal}>
        <div className={estilos.cabecera}>
          <div className={estilos.escudoWrapper}>
            <Escudo tamano={48} textoAlternativo="Escudo Liga Bosque" />
          </div>
          <h2 id="modal-cambio-titulo" className={estilos.titulo}>
            Cambia tu contraseña
          </h2>
          <p className={estilos.subtitulo}>
            Por seguridad, debes actualizar la contraseña temporal antes de continuar con la gestión de la liga.
          </p>
        </div>

        {mensajeGeneral && <Aviso tono="error">{mensajeGeneral}</Aviso>}

        <form className={estilos.formulario} onSubmit={(e) => void manejarEnvio(e)} noValidate>
          <CampoDeTexto
            id="modal-contrasena-actual"
            tipo="password"
            etiqueta="Contraseña actual / temporal"
            valor={contrasenaActual}
            alCambiar={setContrasenaActual}
            mensajeDeError={errores.contrasenaActual}
            permitirVerContrasena
            autoCompletar="current-password"
          />

          <CampoDeTexto
            id="modal-contrasena-nueva"
            tipo="password"
            etiqueta="Nueva contraseña"
            valor={contrasenaNueva}
            alCambiar={setContrasenaNueva}
            mensajeDeError={errores.contrasenaNueva}
            permitirVerContrasena
            autoCompletar="new-password"
            ayuda="Mínimo 8 caracteres, con letras y números."
          />

          <CampoDeTexto
            id="modal-confirmar-contrasena"
            tipo="password"
            etiqueta="Confirmar nueva contraseña"
            valor={confirmarContrasena}
            alCambiar={setConfirmarContrasena}
            mensajeDeError={errores.confirmarContrasena}
            permitirVerContrasena
            autoCompletar="new-password"
          />

          <div className={estilos.acciones}>
            <Boton
              id="btn-guardar-contrasena-modal"
              tipo="submit"
              variante="principal"
              tamano="grande"
              estaCargando={estaEnviando}
            >
              Actualizar contraseña
            </Boton>
            <Boton
              id="btn-cerrar-sesion-modal"
              tipo="button"
              variante="secundario"
              tamano="mediano"
              alPulsar={() => void salir()}
            >
              Cerrar sesión
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}
