import type {
  IntentosFallidos,
  RegistroDeIntentosFallidos,
} from '../aplicacion/puertos/registro-de-intentos-fallidos';
import type { Reloj } from '../aplicacion/puertos/reloj';
import type { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';

interface FilaDeIntentos {
  fallos_seguidos: number;
  bloqueado_hasta: string | null;
}

const SIN_INTENTOS: IntentosFallidos = { fallosSeguidos: 0, bloqueadoHasta: null };

/** Adaptador del registro de intentos sobre la tabla intentos_inicio_sesion de D1. */
export class RegistroDeIntentosFallidosD1 implements RegistroDeIntentosFallidos {
  readonly #baseDeDatos: D1Database;
  readonly #reloj: Reloj;

  constructor(baseDeDatos: D1Database, reloj: Reloj) {
    this.#baseDeDatos = baseDeDatos;
    this.#reloj = reloj;
  }

  async obtener(correo: CorreoElectronico): Promise<IntentosFallidos> {
    const fila = await this.#baseDeDatos
      .prepare(
        'SELECT fallos_seguidos, bloqueado_hasta FROM intentos_inicio_sesion WHERE correo = ?',
      )
      .bind(correo.valor)
      .first<FilaDeIntentos>();

    if (fila === null) return SIN_INTENTOS;
    return {
      fallosSeguidos: fila.fallos_seguidos,
      bloqueadoHasta: fila.bloqueado_hasta === null ? null : new Date(fila.bloqueado_hasta),
    };
  }

  async guardar(correo: CorreoElectronico, intentos: IntentosFallidos): Promise<void> {
    await this.#baseDeDatos
      .prepare(
        `INSERT INTO intentos_inicio_sesion (correo, fallos_seguidos, bloqueado_hasta, actualizado_en)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (correo) DO UPDATE SET
           fallos_seguidos = excluded.fallos_seguidos,
           bloqueado_hasta = excluded.bloqueado_hasta,
           actualizado_en  = excluded.actualizado_en`,
      )
      .bind(
        correo.valor,
        intentos.fallosSeguidos,
        intentos.bloqueadoHasta?.toISOString() ?? null,
        this.#reloj.ahora().toISOString(),
      )
      .run();
  }

  async reiniciar(correo: CorreoElectronico): Promise<void> {
    await this.#baseDeDatos
      .prepare('DELETE FROM intentos_inicio_sesion WHERE correo = ?')
      .bind(correo.valor)
      .run();
  }
}
