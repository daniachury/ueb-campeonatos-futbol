import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import {
  CODIGOS_ERROR_ADMIN,
  type AdminRegistrado,
  type DetalleCorreoEsJugador,
} from '@shared/usuarios/contrato-registro-admin';
import {
  REGLAS_CORREO,
  REGLAS_NOMBRE_COMPLETO,
  REGLAS_TELEFONO,
  normalizarCorreo,
  normalizarNombreCompleto,
  normalizarTelefono,
} from '@shared/usuarios/reglas-registro-jugador';
import { ApiError } from '../../../common/api/client';
import { Aviso } from '../../../common/components/Aviso';
import { Boton } from '../../../common/components/Boton';
import { CampoDeTexto } from '../../../common/components/CampoDeTexto';
import { Marca } from '../../../common/components/Escudo';
import { RUTAS, rutaDeInicioSegunRol } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { promoverJugador, registrarAdmin } from '../api';
import estilos from './RegistrarAdminPage.module.css';

interface DialogoPromocion {
  jugadorId: string;
  nombreJugador: string;
}

export function RegistrarAdminPage() {
  const { usuarioActual, estaComprobando } = useSesion();
  const navegar = useNavigate();

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensajeGeneral, setMensajeGeneral] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const [estaEnviando, setEstaEnviando] = useState(false);
  const [estaPromoviendo, setEstaPromoviendo] = useState(false);

  // Escenario 1: Modal con la contraseña temporal generada
  const [adminCreado, setAdminCreado] = useState<AdminRegistrado | null>(null);
  const [contrasenaCopiada, setContrasenaCopiada] = useState(false);

  // Escenario 3: Diálogo para confirmar la promoción de jugador existente
  const [dialogoPromocion, setDialogoPromocion] = useState<DialogoPromocion | null>(null);

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;
  if (usuarioActual.rol !== 'admin') {
    return <Navigate to={rutaDeInicioSegunRol(usuarioActual.rol)} replace />;
  }
  if (usuarioActual.debeCambiarContrasena) {
    return <Navigate to={RUTAS.GESTION_DE_TORNEOS} replace />;
  }

  function validarFormulario(): boolean {
    const nuevosErrores: Record<string, string> = {};
    const nombreNormalizado = normalizarNombreCompleto(nombreCompleto);
    const correoNormalizado = normalizarCorreo(correo);
    const telNormalizado = normalizarTelefono(telefono);

    if (
      nombreNormalizado.length < REGLAS_NOMBRE_COMPLETO.longitudMinima ||
      nombreNormalizado.length > REGLAS_NOMBRE_COMPLETO.longitudMaxima ||
      !REGLAS_NOMBRE_COMPLETO.patronCaracteresPermitidos.test(nombreNormalizado)
    ) {
      nuevosErrores.nombreCompleto = REGLAS_NOMBRE_COMPLETO.mensajeError;
    }

    if (
      correoNormalizado.length > REGLAS_CORREO.longitudMaxima ||
      !REGLAS_CORREO.patronFormato.test(correoNormalizado)
    ) {
      nuevosErrores.correo = REGLAS_CORREO.mensajeFormatoInvalido;
    }

    if (!REGLAS_TELEFONO.patronFormato.test(telNormalizado)) {
      nuevosErrores.telefono = REGLAS_TELEFONO.mensajeError;
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function manejarEnvio(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setMensajeGeneral(null);
    setMensajeExito(null);

    if (!validarFormulario()) return;

    setEstaEnviando(true);
    try {
      const creado = await registrarAdmin({
        nombreCompleto: normalizarNombreCompleto(nombreCompleto),
        correo: normalizarCorreo(correo),
        telefono: normalizarTelefono(telefono),
      });
      setAdminCreado(creado);
      setNombreCompleto('');
      setCorreo('');
      setTelefono('');
      setErrores({});
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.codigo === CODIGOS_ERROR_ADMIN.CORREO_YA_ES_ADMIN) {
          setErrores((prev) => ({
            ...prev,
            correo: 'Este correo ya pertenece a un administrador',
          }));
        } else if (error.codigo === CODIGOS_ERROR_ADMIN.CORREO_ES_JUGADOR) {
          const detalles = error.detalles as DetalleCorreoEsJugador | undefined;
          setDialogoPromocion({
            jugadorId: detalles?.jugadorId ?? '',
            nombreJugador: detalles?.nombreJugador ?? nombreCompleto,
          });
        } else {
          setMensajeGeneral(error.message);
        }
      } else {
        setMensajeGeneral('Ocurrió un error inesperado al procesar la solicitud');
      }
    } finally {
      setEstaEnviando(false);
    }
  }

  async function confirmarPromocion(): Promise<void> {
    if (!dialogoPromocion) return;
    setEstaPromoviendo(true);
    setMensajeGeneral(null);

    try {
      await promoverJugador(dialogoPromocion.jugadorId);
      setDialogoPromocion(null);
      setMensajeExito(
        `¡El jugador ${dialogoPromocion.nombreJugador} ha sido promovido a administrador!`,
      );
      setNombreCompleto('');
      setCorreo('');
      setTelefono('');
      setErrores({});
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.codigo === CODIGOS_ERROR_ADMIN.JUGADOR_EN_TORNEO_EN_CURSO) {
          setMensajeGeneral(
            'No se puede promover: el jugador participa en un equipo con torneo en curso.',
          );
        } else {
          setMensajeGeneral(error.message);
        }
      } else {
        setMensajeGeneral('No se pudo promover al jugador. Intenta de nuevo.');
      }
      setDialogoPromocion(null);
    } finally {
      setEstaPromoviendo(false);
    }
  }

  async function copiarContrasena(): Promise<void> {
    if (!adminCreado) return;
    try {
      await navigator.clipboard.writeText(adminCreado.contrasenaTemporal);
      setContrasenaCopiada(true);
      setTimeout(() => setContrasenaCopiada(false), 3000);
    } catch {
      // Si el portapapeles no está disponible
    }
  }

  return (
    <div className={estilos.pantalla}>
      <header className={estilos.encabezado}>
        <Marca />
        <Boton
          id="btn-volver-panel"
          variante="secundario"
          tamano="mediano"
          anchoCompleto={false}
          alPulsar={() => void navegar(RUTAS.GESTION_DE_TORNEOS)}
        >
          Volver a gestión
        </Boton>
      </header>

      <main className={estilos.contenido}>
        <div>
          <h1 className={estilos.titulo}>Registrar administrador</h1>
          <p className={estilos.subtitulo}>
            Crea una nueva cuenta de administrador para compartir la gestión de los torneos.
          </p>
        </div>

        {mensajeExito && <div className={estilos.avisoExito}>{mensajeExito}</div>}
        {mensajeGeneral && <Aviso tono="error">{mensajeGeneral}</Aviso>}

        <div className={estilos.tarjeta}>
          <form className={estilos.formulario} onSubmit={(e) => void manejarEnvio(e)} noValidate>
            <CampoDeTexto
              id="admin-nombre"
              etiqueta="Nombre completo"
              valor={nombreCompleto}
              alCambiar={setNombreCompleto}
              mensajeDeError={errores.nombreCompleto}
              autoCompletar="name"
            />

            <CampoDeTexto
              id="admin-correo"
              tipo="email"
              etiqueta="Correo electrónico"
              valor={correo}
              alCambiar={setCorreo}
              mensajeDeError={errores.correo}
              autoCompletar="email"
            />

            <CampoDeTexto
              id="admin-telefono"
              tipo="tel"
              etiqueta="Teléfono"
              valor={telefono}
              alCambiar={setTelefono}
              mensajeDeError={errores.telefono}
              autoCompletar="tel"
            />

            <div className={estilos.acciones}>
              <Boton
                id="btn-registrar-admin"
                tipo="submit"
                variante="principal"
                estaCargando={estaEnviando}
                estaDeshabilitado={estaEnviando}
              >
                {estaEnviando ? 'Registrando…' : 'Registrar administrador'}
              </Boton>
            </div>
          </form>
        </div>
      </main>

      {/* Modal de Escenario 1: Contraseña temporal generada */}
      {adminCreado && (
        <div className={estilos.velo} role="dialog" aria-modal="true" id="modal-admin-creado">
          <div className={estilos.modal}>
            <h2 className={estilos.modalTitulo}>¡Administrador registrado!</h2>
            <p className={estilos.modalTexto}>
              La cuenta para <strong>{adminCreado.nombreCompleto}</strong> ha sido creada. Comparte
              la siguiente contraseña temporal. Solo se mostrará en esta ocasión:
            </p>

            <div className={estilos.cajaContrasena}>
              <span className={estilos.contrasenaValor} id="texto-contrasena-temporal">
                {adminCreado.contrasenaTemporal}
              </span>
              <Boton
                id="btn-copiar-contrasena"
                variante="secundario"
                tamano="mediano"
                anchoCompleto={false}
                alPulsar={() => void copiarContrasena()}
              >
                {contrasenaCopiada ? '✓ ¡Copiada!' : 'Copiar contraseña'}
              </Boton>
            </div>

            <p className={estilos.modalTexto}>
              Al iniciar sesión por primera vez, el nuevo administrador deberá cambiar esta
              contraseña obligatoriamente.
            </p>

            <Boton id="btn-cerrar-modal" variante="principal" alPulsar={() => setAdminCreado(null)}>
              Entendido
            </Boton>
          </div>
        </div>
      )}

      {/* Modal de Escenario 3: Diálogo de promoción de jugador */}
      {dialogoPromocion && (
        <div
          className={estilos.velo}
          role="dialog"
          aria-modal="true"
          id="modal-confirmar-promocion"
        >
          <div className={estilos.modal}>
            <h2 className={estilos.modalTitulo}>El correo pertenece a un jugador</h2>
            <p className={estilos.modalTexto}>
              El correo ingresado ya pertenece al jugador{' '}
              <strong>{dialogoPromocion.nombreJugador}</strong>.
            </p>
            <p className={estilos.modalTexto}>
              ¿Deseas promover a <strong>{dialogoPromocion.nombreJugador}</strong> a administrador?
              Conservará su cuenta y su contraseña actual, pero cambiará a rol Administrador y se
              desvinculará de sus equipos.
            </p>

            <div className={estilos.acciones}>
              <Boton
                id="btn-confirmar-promocion"
                variante="principal"
                estaCargando={estaPromoviendo}
                estaDeshabilitado={estaPromoviendo}
                alPulsar={() => void confirmarPromocion()}
              >
                {estaPromoviendo ? 'Promoviendo…' : 'Promover a administrador'}
              </Boton>
              <Boton
                id="btn-cancelar-promocion"
                variante="secundario"
                alPulsar={() => setDialogoPromocion(null)}
                estaDeshabilitado={estaPromoviendo}
              >
                Cancelar
              </Boton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
