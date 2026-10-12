import type { ErrorApi } from '@shared/api';

/** Error de la API con el código del backend, para mostrar mensajes claros en pantalla. */
export class ApiError extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalles?: unknown;

  constructor(status: number, codigo: string, mensaje: string, detalles?: unknown) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

/** Código con el que la API avisa que pasaron las 24 horas de la sesión (KAN-17 · Escenario 7). */
const CODIGO_SESION_EXPIRADA = 'SESION_EXPIRADA';
const escuchasDeSesionExpirada = new Set<() => void>();

/**
 * Avisa cada vez que cualquier petición encuentra la sesión vencida, para que la app
 * lleve a Iniciar sesión con «Tu sesión expiró, ingresa de nuevo». Devuelve cómo dejar de escuchar.
 */
export function escucharSesionExpirada(alExpirar: () => void): () => void {
  escuchasDeSesionExpirada.add(alExpirar);
  return () => escuchasDeSesionExpirada.delete(alExpirar);
}

const esErrorApi = (valor: unknown): valor is ErrorApi =>
  typeof valor === 'object' && valor !== null && 'codigo' in valor && 'mensaje' in valor;

/**
 * Único punto de salida del frontend hacia el backend.
 * `ruta` es relativa a /api, por ejemplo: pedir('/torneos').
 */
export async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const encabezados = new Headers(opciones.headers);
  encabezados.set('Accept', 'application/json');
  if (opciones.body && !encabezados.has('Content-Type')) {
    encabezados.set('Content-Type', 'application/json');
  }

  const respuesta = await fetch(`/api${ruta}`, { ...opciones, headers: encabezados });
  const cuerpo: unknown = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    if (esErrorApi(cuerpo)) {
      if (respuesta.status === 401 && cuerpo.codigo === CODIGO_SESION_EXPIRADA) {
        escuchasDeSesionExpirada.forEach((alExpirar) => alExpirar());
      }
      throw new ApiError(respuesta.status, cuerpo.codigo, cuerpo.mensaje, cuerpo.detalles);
    }
    throw new ApiError(
      respuesta.status,
      'ERROR_DESCONOCIDO',
      'No pudimos comunicarnos con el servidor. Intenta de nuevo.',
    );
  }

  return cuerpo as T;
}
