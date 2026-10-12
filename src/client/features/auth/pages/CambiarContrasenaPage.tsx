import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { REGLAS_CONTRASENA } from '@shared/usuarios/reglas-registro-jugador';
import { ApiError } from '../../../common/api/client';
import { Aviso } from '../../../common/components/Aviso';
import { Boton } from '../../../common/components/Boton';
import { CampoDeTexto } from '../../../common/components/CampoDeTexto';
import { Marca } from '../../../common/components/Escudo';
import { RUTAS, rutaDeInicioSegunRol } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { cambiarContrasena } from '../../admin/api';
import estilos from './CambiarContrasenaPage.module.css';

export function CambiarContrasenaPage() {
  const { usuarioActual, estaComprobando, establecerSesion, cerrarSesion } = useSesion();
  const navegar = useNavigate();

  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensajeGeneral, setMensajeGeneral] = useState<string | null>(null);
  const [estaEnviando, setEstaEnviando] = useState(false);

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;

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

  async function manejarEnvio(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setMensajeGeneral(null);

    if (!validar()) return;

    setEstaEnviando(true);
    try {
      await cambiarContrasena({ contrasenaActual, contrasenaNueva });
      // Actualizar sesión para remover debeCambiarContrasena
      establecerSesion({
        ...usuarioActual!,
        debeCambiarContrasena: false,
      });
      void navegar(rutaDeInicioSegunRol(usuarioActual!.rol), { replace: true });
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
    <div className={estilos.pantalla}>
      <header className={estilos.encabezado}>
        <Marca />
        <Boton
          id="btn-cerrar-sesion-cambio"
          variante="secundario"
          tamano="mediano"
          anchoCompleto={false}
          alPulsar={() => void salir()}
        >
          Cerrar sesión
        </Boton>
      </header>

      <main className={estilos.contenido}>
        <div>
          <h1 className={estilos.titulo}>Cambia tu contraseña</h1>
          <p className={estilos.subtitulo}>
            Por motivos de seguridad, debes cambiar tu contraseña temporal antes de continuar al
            panel.
          </p>
        </div>

        {mensajeGeneral && <Aviso tono="error">{mensajeGeneral}</Aviso>}

        <div className={estilos.tarjeta}>
          <form className={estilos.formulario} onSubmit={(e) => void manejarEnvio(e)} noValidate>
            <CampoDeTexto
              id="contrasena-actual"
              tipo="password"
              etiqueta="Contraseña actual / temporal"
              valor={contrasenaActual}
              alCambiar={setContrasenaActual}
              mensajeDeError={errores.contrasenaActual}
              permitirVerContrasena
              autoCompletar="current-password"
            />

            <CampoDeTexto
              id="contrasena-nueva"
              tipo="password"
              etiqueta="Nueva contraseña"
              valor={contrasenaNueva}
              alCambiar={setContrasenaNueva}
              mensajeDeError={errores.contrasenaNueva}
              permitirVerContrasena
              autoCompletar="new-password"
            />

            <div className={estilos.requisitos}>
              Mínimo 8 caracteres, combinando al menos una letra y un número. Debe ser diferente a
              la contraseña actual.
            </div>

            <CampoDeTexto
              id="confirmar-contrasena"
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
                id="btn-actualizar-contrasena"
                tipo="submit"
                variante="principal"
                estaCargando={estaEnviando}
                estaDeshabilitado={estaEnviando}
              >
                {estaEnviando ? 'Guardando…' : 'Actualizar contraseña'}
              </Boton>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
