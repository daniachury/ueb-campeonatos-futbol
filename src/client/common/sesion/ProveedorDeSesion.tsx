import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { escucharSesionExpirada } from '../api/client';
import type { ServicioDeSesion } from './servicio-de-sesion';

interface Sesion {
  usuarioActual: UsuarioAutenticado | null;
  /** true mientras se pregunta al servidor por la cookie al abrir la app (v3 · S01). */
  estaComprobando: boolean;
  /** KAN-17 · Escenario 7: la sesión venció; Iniciar sesión muestra el aviso. */
  sesionExpiro: boolean;
  /** Guarda al usuario que acaba de registrarse o iniciar sesión. */
  establecerSesion: (usuario: UsuarioAutenticado) => void;
  /** KAN-17 · Escenario 6: invalida el token en el servidor y olvida al usuario. */
  cerrarSesion: () => Promise<void>;
}

const ContextoDeSesion = createContext<Sesion | null>(null);

interface PropiedadesProveedorDeSesion {
  children: ReactNode;
  servicioDeSesion: ServicioDeSesion;
  /**
   * Sesión con la que arranca la app sin preguntar al servidor (para pruebas).
   * Si no llega, la app consulta la cookie al abrir.
   */
  usuarioInicial?: UsuarioAutenticado | null;
}

/** Guarda quién tiene la sesión iniciada y la comparte con todas las pantallas. */
export function ProveedorDeSesion({
  children,
  servicioDeSesion,
  usuarioInicial,
}: PropiedadesProveedorDeSesion) {
  const debeConsultar = usuarioInicial === undefined;
  const [usuarioActual, setUsuarioActual] = useState<UsuarioAutenticado | null>(
    usuarioInicial ?? null,
  );
  const [estaComprobando, setEstaComprobando] = useState(debeConsultar);
  const [sesionExpiro, setSesionExpiro] = useState(false);

  // Al abrir la app: ¿la cookie sigue siendo válida? Así la sesión sobrevive a una recarga.
  useEffect(() => {
    if (!debeConsultar) return;
    let sigueMontado = true;
    servicioDeSesion
      .consultarSesionActual()
      .then((resultado) => {
        if (!sigueMontado) return;
        if (resultado.estado === 'activa') setUsuarioActual(resultado.usuario);
        setSesionExpiro(resultado.estado === 'expirada');
      })
      .catch(() => undefined) // Sin conexión: se sigue sin sesión.
      .finally(() => {
        if (sigueMontado) setEstaComprobando(false);
      });
    return () => {
      sigueMontado = false;
    };
  }, [debeConsultar, servicioDeSesion]);

  // Escenario 7: cualquier petición que encuentre la sesión vencida la cierra aquí.
  useEffect(
    () =>
      escucharSesionExpirada(() => {
        setUsuarioActual(null);
        setSesionExpiro(true);
      }),
    [],
  );

  const establecerSesion = useCallback((usuario: UsuarioAutenticado) => {
    setUsuarioActual(usuario);
    setSesionExpiro(false);
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await servicioDeSesion.cerrarSesion();
    } finally {
      // Aunque falle la red, en este navegador la sesión se olvida.
      setUsuarioActual(null);
      setSesionExpiro(false);
    }
  }, [servicioDeSesion]);

  const sesion = useMemo<Sesion>(
    () => ({ usuarioActual, estaComprobando, sesionExpiro, establecerSesion, cerrarSesion }),
    [usuarioActual, estaComprobando, sesionExpiro, establecerSesion, cerrarSesion],
  );

  return <ContextoDeSesion.Provider value={sesion}>{children}</ContextoDeSesion.Provider>;
}

export function useSesion(): Sesion {
  const sesion = useContext(ContextoDeSesion);
  if (sesion === null) {
    throw new Error('useSesion debe usarse dentro de <ProveedorDeSesion>');
  }
  return sesion;
}

export function useSesionOpcional(): Sesion | null {
  return useContext(ContextoDeSesion);
}
