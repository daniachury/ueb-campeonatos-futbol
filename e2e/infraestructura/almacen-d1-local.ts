import type {
  EquipoDePrueba,
  EstadoDeInscripcion,
  EstadoDeTorneo,
  InscripcionDePrueba,
  TorneoDePrueba,
  UsuarioDePrueba,
} from '../dominio/modelos';
import type { AlmacenDeDatosDePrueba, UsuarioGuardado } from '../dominio/puertos/almacen-de-datos';
import { cifrarContrasena } from './cifrador-pbkdf2';

/** Valores que una consulta puede recibir. La API local de D1 los transporta como texto. */
type Parametro = string | number;

interface Consulta {
  sql: string;
  params?: Parametro[];
}

interface RespuestaDeLaApi {
  success: boolean;
  errors: { message: string }[];
  result: { results: { columns: string[]; rows: unknown[][] } }[];
}

/**
 * Adaptador del puerto sobre la D1 local de `wrangler dev`, usando su API de exploración.
 * Las consultas pasan por el mismo runtime que la app, así no compiten con sus transacciones.
 * Es el único lugar de las pruebas que conoce SQL.
 */
export class AlmacenD1Local implements AlmacenDeDatosDePrueba {
  readonly #urlBase: string;
  readonly #rutaDeLaApi: string;
  readonly #nombreDelBinding: string;
  #urlDeConsultas: Promise<string> | null = null;

  constructor(opciones: { urlBase: string; rutaDeLaApi: string; nombreDelBinding: string }) {
    this.#urlBase = opciones.urlBase;
    this.#rutaDeLaApi = opciones.rutaDeLaApi;
    this.#nombreDelBinding = opciones.nombreDelBinding;
  }

  async guardarUsuario(usuario: UsuarioDePrueba): Promise<void> {
    const ahora = new Date().toISOString();
    await this.#ejecutar({
      sql: `INSERT INTO usuarios
              (id, nombre_completo, correo, telefono, hash_contrasena, rol, activo,
               debe_cambiar_contrasena, creado_en, actualizado_en)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        usuario.id,
        usuario.nombreCompleto,
        usuario.correo.toLowerCase(),
        usuario.telefono,
        await cifrarContrasena(usuario.contrasena),
        usuario.rol,
        usuario.activo ? 1 : 0,
        usuario.debeCambiarContrasena ? 1 : 0,
        ahora,
        ahora,
      ],
    });
  }

  async guardarTorneo(torneo: TorneoDePrueba): Promise<void> {
    await this.#ejecutar({
      sql: 'INSERT INTO torneos (id, nombre, fecha_inicio, cupo, estado) VALUES (?, ?, ?, ?, ?)',
      params: [torneo.id, torneo.nombre, torneo.fechaInicio, torneo.cupo, torneo.estado],
    });
  }

  async guardarEquipo(equipo: EquipoDePrueba): Promise<void> {
    await this.#ejecutar(
      {
        // La API solo transporta texto: un equipo sin capitán viaja como '' y se guarda NULL.
        sql: "INSERT INTO equipos (id, nombre, capitan_id) VALUES (?, ?, NULLIF(?, ''))",
        params: [equipo.id, equipo.nombre, equipo.capitanId ?? ''],
      },
      ...equipo.jugadorIds.map((jugadorId) => ({
        sql: 'INSERT INTO equipo_jugadores (equipo_id, usuario_id) VALUES (?, ?)',
        params: [equipo.id, jugadorId],
      })),
    );
  }

  async guardarInscripcion(inscripcion: InscripcionDePrueba): Promise<void> {
    await this.#ejecutar({
      sql: 'INSERT INTO inscripciones (id, torneo_id, equipo_id, estado) VALUES (?, ?, ?, ?)',
      params: [inscripcion.id, inscripcion.torneoId, inscripcion.equipoId, inscripcion.estado],
    });
  }

  async buscarUsuarioPorCorreo(correo: string): Promise<UsuarioGuardado | null> {
    const fila = await this.#primeraFila<FilaDeUsuario>({
      sql: `SELECT id, nombre_completo, telefono, rol, hash_contrasena, debe_cambiar_contrasena
              FROM usuarios WHERE correo = ?`,
      params: [correo.toLowerCase()],
    });
    if (!fila) return null;
    return {
      id: fila.id,
      nombreCompleto: fila.nombre_completo,
      telefono: fila.telefono,
      rol: fila.rol,
      hashDeContrasena: fila.hash_contrasena,
      debeCambiarContrasena: fila.debe_cambiar_contrasena === 1,
    };
  }

  async estadoDelTorneo(torneoId: string): Promise<EstadoDeTorneo | null> {
    const fila = await this.#primeraFila<{ estado: EstadoDeTorneo }>({
      sql: 'SELECT estado FROM torneos WHERE id = ?',
      params: [torneoId],
    });
    return fila?.estado ?? null;
  }

  async estadoDeLaInscripcion(inscripcionId: string): Promise<EstadoDeInscripcion | null> {
    const fila = await this.#primeraFila<{ estado: EstadoDeInscripcion }>({
      sql: 'SELECT estado FROM inscripciones WHERE id = ?',
      params: [inscripcionId],
    });
    return fila?.estado ?? null;
  }

  async cantidadDePartidos(torneoId: string): Promise<number> {
    const fila = await this.#primeraFila<{ total: number }>({
      sql: 'SELECT COUNT(*) AS total FROM partidos WHERE torneo_id = ?',
      params: [torneoId],
    });
    return fila?.total ?? 0;
  }

  async #primeraFila<Fila>(consulta: Consulta): Promise<Fila | null> {
    const [resultado] = await this.#ejecutar(consulta);
    const { columns, rows } = resultado!.results;
    const [primera] = rows;
    if (!primera) return null;
    return Object.fromEntries(columns.map((columna, i) => [columna, primera[i]])) as Fila;
  }

  /** Varias consultas viajan juntas en un lote: o se aplican todas o ninguna. */
  async #ejecutar(...consultas: Consulta[]): Promise<RespuestaDeLaApi['result']> {
    // La API local de D1 solo acepta parámetros de texto; las columnas INTEGER los convierten.
    const comoTexto = consultas.map(({ sql, params = [] }) => ({
      sql,
      params: params.map(String),
    }));
    const cuerpo = comoTexto.length === 1 ? comoTexto[0] : { batch: comoTexto };
    const respuesta = await fetch(await this.#urlDeConsultasDeLaBase(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    const datos = (await respuesta.json()) as RespuestaDeLaApi;
    if (!respuesta.ok || !datos.success) {
      const detalle = datos.errors.map((error) => error.message).join('; ');
      throw new Error(`La D1 de pruebas rechazó la consulta: ${detalle}`);
    }
    return datos.result;
  }

  /** El id de la base se pide una vez: es el de wrangler.jsonc, pero aquí no se repite. */
  #urlDeConsultasDeLaBase(): Promise<string> {
    this.#urlDeConsultas ??= (async () => {
      const respuesta = await fetch(`${this.#urlBase}${this.#rutaDeLaApi}`);
      const { result } = (await respuesta.json()) as { result: { name: string; uuid: string }[] };
      const base = result.find((d1) => d1.name === this.#nombreDelBinding);
      if (!base) throw new Error(`wrangler dev no expone una D1 llamada ${this.#nombreDelBinding}`);
      return `${this.#urlBase}${this.#rutaDeLaApi}/${base.uuid}/raw`;
    })();
    return this.#urlDeConsultas;
  }
}

interface FilaDeUsuario {
  id: string;
  nombre_completo: string;
  telefono: string;
  rol: UsuarioDePrueba['rol'];
  hash_contrasena: string;
  debe_cambiar_contrasena: number;
}
