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
  // Se guarda junto con las dependencias que lo produjeron: si cambian, el resultado anterior
  // ya no sirve y se muestra «cargando» sin tener que reiniciar el estado dentro del efecto.
  const [resultado, setResultado] = useState<{
    dependencias: DependencyList;
    estado: EstadoConsulta<T>;
  } | null>(null);

  useEffect(() => {
    const control = new AbortController();

    cargar(control.signal).then(
      (datos) => {
        if (!control.signal.aborted)
          setResultado({ dependencias, estado: { tipo: 'listo', datos } });
      },
      (error: unknown) => {
        if (!control.signal.aborted) {
          setResultado({ dependencias, estado: { tipo: 'error', mensaje: mensajeDeError(error) } });
        }
      },
    );

    return () => control.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- quien llama define las dependencias
  }, dependencias);

  const vigente = resultado !== null && sonLasMismas(resultado.dependencias, dependencias);
  return vigente ? resultado.estado : { tipo: 'cargando' };
}

function sonLasMismas(anteriores: DependencyList, actuales: DependencyList): boolean {
  return (
    anteriores.length === actuales.length &&
    anteriores.every((valor, posicion) => Object.is(valor, actuales[posicion]))
  );
}

function mensajeDeError(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
}
