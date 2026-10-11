import { useEffect, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router';
import type { PerfilUsuario } from '@shared/usuarios/contrato-perfil';
import { ApiError } from '../../../common/api/client';
import { Avatar } from '../../../common/components/Avatar';
import { Aviso } from '../../../common/components/Aviso';
import { Boton } from '../../../common/components/Boton';
import { CampoDeTexto } from '../../../common/components/CampoDeTexto';
import { RUTAS } from '../../../common/navegacion';
import { useSesion } from '../../../common/sesion/ProveedorDeSesion';
import { actualizarMiPerfil, cambiarMiContrasena, obtenerMiPerfil } from '../api';
import estilos from './MiPerfilPage.module.css';

export function MiPerfilPage() {
  const { usuarioActual, estaComprobando, establecerSesion } = useSesion();

  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [estaCargando, setEstaCargando] = useState(true);

  // Campos de Datos personales
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasenaActualParaCorreo, setContrasenaActualParaCorreo] = useState('');

  // Mensajes de la sección Datos
  const [mensajeExitoDatos, setMensajeExitoDatos] = useState<string | null>(null);
  const [mensajeErrorDatos, setMensajeErrorDatos] = useState<string | null>(null);
  const [estaGuardandoDatos, setEstaGuardandoDatos] = useState(false);

  // Campos de Seguridad
  const [contrasenaActualSeguridad, setContrasenaActualSeguridad] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');

  // Mensajes de la sección Seguridad
  const [mensajeExitoSeguridad, setMensajeExitoSeguridad] = useState<string | null>(null);
  const [mensajeErrorSeguridad, setMensajeErrorSeguridad] = useState<string | null>(null);
  const [estaCambiandoContrasena, setEstaCambiandoContrasena] = useState(false);

  useEffect(() => {
    if (!usuarioActual) return;
    let montado = true;

    obtenerMiPerfil()
      .then((datos) => {
        if (!montado) return;
        setPerfil(datos);
        setNombreCompleto(datos.nombreCompleto);
        setTelefono(datos.telefono);
        setCorreo(datos.correo);
        setEstaCargando(false);
      })
      .catch((error: unknown) => {
        if (!montado) return;
        if (error instanceof ApiError) {
          setMensajeErrorDatos(error.message);
        }
        setEstaCargando(false);
      });

    return () => {
      montado = false;
    };
  }, [usuarioActual]);

  if (estaComprobando) return null;
  if (!usuarioActual) return <Navigate to={RUTAS.INICIAR_SESION} replace />;

  if (estaCargando || !perfil) {
    return <div className={estilos.cargando}>Cargando perfil…</div>;
  }

  // Escenario 5: El botón Guardar está deshabilitado si no se ha modificado ningún campo
  const correoCambio = correo.trim().toLowerCase() !== perfil.correo.trim().toLowerCase();
  const nombreCambio = nombreCompleto.trim() !== perfil.nombreCompleto.trim();
  const telefonoCambio = telefono.trim() !== perfil.telefono.trim();
  const huboCambiosEnDatos = nombreCambio || telefonoCambio || correoCambio;

  const botonGuardarDatosDeshabilitado =
    !huboCambiosEnDatos ||
    estaGuardandoDatos ||
    (correoCambio && !contrasenaActualParaCorreo);

  const botonCambiarContrasenaDeshabilitado =
    estaCambiandoContrasena ||
    !contrasenaActualSeguridad ||
    !nuevaContrasena ||
    !confirmarContrasena;

  async function manejarGuardarDatos(e: FormEvent) {
    e.preventDefault();
    if (botonGuardarDatosDeshabilitado) return;

    setEstaGuardandoDatos(true);
    setMensajeExitoDatos(null);
    setMensajeErrorDatos(null);

    try {
      const resultado = await actualizarMiPerfil({
        nombreCompleto: nombreCambio ? nombreCompleto : undefined,
        telefono: telefonoCambio ? telefono : undefined,
        correo: correoCambio ? correo : undefined,
        contrasenaActual: correoCambio ? contrasenaActualParaCorreo : undefined,
      });

      setPerfil(resultado);
      setNombreCompleto(resultado.nombreCompleto);
      setTelefono(resultado.telefono);
      setCorreo(resultado.correo);
      setContrasenaActualParaCorreo('');
      setMensajeExitoDatos('Datos actualizados');

      // Actualizar la sesión global en el cliente
      establecerSesion({
        id: resultado.id,
        nombreCompleto: resultado.nombreCompleto,
        correo: resultado.correo,
        telefono: resultado.telefono,
        rol: resultado.rol,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setMensajeErrorDatos(error.message);
      } else {
        setMensajeErrorDatos('Ocurrió un error inesperado al actualizar los datos');
      }
    } finally {
      setEstaGuardandoDatos(false);
    }
  }

  async function manejarCambiarContrasena(e: FormEvent) {
    e.preventDefault();
    if (botonCambiarContrasenaDeshabilitado) return;

    if (nuevaContrasena !== confirmarContrasena) {
      setMensajeErrorSeguridad('Las contraseñas no coinciden');
      return;
    }

    setEstaCambiandoContrasena(true);
    setMensajeExitoSeguridad(null);
    setMensajeErrorSeguridad(null);

    try {
      await cambiarMiContrasena({
        contrasenaActual: contrasenaActualSeguridad,
        nuevaContrasena,
        confirmarContrasena,
      });

      setMensajeExitoSeguridad('Contraseña actualizada');
      setContrasenaActualSeguridad('');
      setNuevaContrasena('');
      setConfirmarContrasena('');
    } catch (error) {
      if (error instanceof ApiError) {
        setMensajeErrorSeguridad(error.message);
      } else {
        setMensajeErrorSeguridad('Ocurrió un error inesperado al cambiar la contraseña');
      }
    } finally {
      setEstaCambiandoContrasena(false);
    }
  }

  return (
    <main className={estilos.pagina}>
      <header className={estilos.encabezado}>
        <Avatar nombreCompleto={perfil.nombreCompleto} tamano={52} />
        <div className={estilos.infoUsuario}>
          <h1 className={estilos.nombre}>{perfil.nombreCompleto}</h1>
          <span className={estilos.rolTag}>
            {perfil.rol === 'admin' ? 'Administrador' : 'Jugador'}
          </span>
        </div>
      </header>

      {/* Sección 1: Datos personales */}
      <section className={estilos.seccion} aria-labelledby="titulo-datos">
        <h2 id="titulo-datos" className={estilos.tituloSeccion}>
          Datos personales
        </h2>
        <p className={estilos.descripcionSeccion}>
          Mantén actualizado tu nombre, teléfono y correo electrónico.
        </p>

        {mensajeExitoDatos && <Aviso tono="informativo">{mensajeExitoDatos}</Aviso>}
        {mensajeErrorDatos && <Aviso tono="error">{mensajeErrorDatos}</Aviso>}

        <form className={estilos.formulario} onSubmit={manejarGuardarDatos} noValidate>
          <CampoDeTexto
            id="campo-nombre"
            etiqueta="Nombre completo"
            valor={nombreCompleto}
            alCambiar={setNombreCompleto}
            tipo="text"
          />

          <CampoDeTexto
            id="campo-telefono"
            etiqueta="Teléfono"
            valor={telefono}
            alCambiar={setTelefono}
            tipo="tel"
          />

          <CampoDeTexto
            id="campo-correo"
            etiqueta="Correo electrónico"
            valor={correo}
            alCambiar={setCorreo}
            tipo="email"
          />

          {correoCambio && (
            <CampoDeTexto
              id="campo-contrasena-actual-correo"
              etiqueta="Contraseña actual para confirmar"
              valor={contrasenaActualParaCorreo}
              alCambiar={setContrasenaActualParaCorreo}
              tipo="password"
              permitirVerContrasena
              ayuda="Para cambiar tu correo debes confirmar tu contraseña actual."
            />
          )}

          <div className={estilos.acciones}>
            <Boton
              tipo="submit"
              variante="principal"
              estaDeshabilitado={botonGuardarDatosDeshabilitado}
              estaCargando={estaGuardandoDatos}
            >
              Guardar
            </Boton>
          </div>
        </form>
      </section>

      {/* Sección 2: Seguridad (Contraseña) */}
      <section className={estilos.seccion} aria-labelledby="titulo-seguridad">
        <h2 id="titulo-seguridad" className={estilos.tituloSeccion}>
          Seguridad
        </h2>
        <p className={estilos.descripcionSeccion}>
          Actualiza tu contraseña periódicamente para proteger tu cuenta. Al cambiarla, se cerrarán tus demás sesiones abiertas.
        </p>

        {mensajeExitoSeguridad && <Aviso tono="informativo">{mensajeExitoSeguridad}</Aviso>}
        {mensajeErrorSeguridad && <Aviso tono="error">{mensajeErrorSeguridad}</Aviso>}

        <form className={estilos.formulario} onSubmit={manejarCambiarContrasena} noValidate>
          <CampoDeTexto
            id="campo-contrasena-actual"
            etiqueta="Contraseña actual"
            valor={contrasenaActualSeguridad}
            alCambiar={setContrasenaActualSeguridad}
            tipo="password"
            permitirVerContrasena
          />

          <CampoDeTexto
            id="campo-nueva-contrasena"
            etiqueta="Nueva contraseña"
            valor={nuevaContrasena}
            alCambiar={setNuevaContrasena}
            tipo="password"
            permitirVerContrasena
            ayuda="Mínimo 8 caracteres, con letras y números."
          />

          <CampoDeTexto
            id="campo-confirmar-contrasena"
            etiqueta="Confirmar nueva contraseña"
            valor={confirmarContrasena}
            alCambiar={setConfirmarContrasena}
            tipo="password"
            permitirVerContrasena
          />

          <div className={estilos.acciones}>
            <Boton
              tipo="submit"
              variante="principal"
              estaDeshabilitado={botonCambiarContrasenaDeshabilitado}
              estaCargando={estaCambiandoContrasena}
            >
              Actualizar contraseña
            </Boton>
          </div>
        </form>
      </section>
    </main>
  );
}
