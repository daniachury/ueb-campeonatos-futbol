import { useEffect, useState, type DependencyList } from 'react';
import { ApiError } from '../api/client';

export type EstadoConsulta<T> =
  { tipo: 'cargando' } | { tipo: 'listo'; datos: T } | { tipo: 'error'; mensaje: string };

/**
 * Carga datos al montar el componente y cada vez que cambian las dependencias.
 * Cancela la petición anterior si el usuario cambia de filtro o sale de la pantalla.
 */
export function useConsulta<T>(
  cargar: (senal: AbortSignal) => Promise<T>,
  dependencias: DependencyList,
): EstadoConsulta<T> {
  const [estado, setEstado] = useState<EstadoConsulta<T>>({ tipo: 'cargando' });

  useEffect(() => {
    const control = new AbortController();
    setEstado({ tipo: 'cargando' });

    cargar(control.signal).then(
      (datos) => {
        if (!control.signal.aborted) setEstado({ tipo: 'listo', datos });
      },
      (error: unknown) => {
        if (!control.signal.aborted) setEstado({ tipo: 'error', mensaje: mensajeDeError(error) });
      },
    );

    return () => control.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- quien llama define las dependencias
  }, dependencias);

  return estado;
}

function mensajeDeError(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
}
