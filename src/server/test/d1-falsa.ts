type Fila = object;

export interface ConsultaRegistrada {
  sql: string;
  parametros: unknown[];
}

/**
 * D1 falsa para pruebas rápidas en Node: registra cada consulta y devuelve las filas que
 * indique `responder`. Para pruebas contra una D1 real se puede usar
 * @cloudflare/vitest-pool-workers más adelante.
 */
export function crearD1Falsa(responder: (sql: string, parametros: unknown[]) => Fila[] = () => []) {
  const consultas: ConsultaRegistrada[] = [];

  const db = {
    prepare(sql: string) {
      let parametros: unknown[] = [];
      const sentencia = {
        bind(...valores: unknown[]) {
          parametros = valores;
          return sentencia;
        },
        async all() {
          consultas.push({ sql, parametros });
          return { results: responder(sql, parametros), success: true, meta: {} };
        },
        async first() {
          consultas.push({ sql, parametros });
          return responder(sql, parametros)[0] ?? null;
        },
        async run() {
          consultas.push({ sql, parametros });
          responder(sql, parametros);
          return { results: [], success: true, meta: {} };
        },
      };
      return sentencia;
    },
  };

  return { db: db as unknown as D1Database, consultas };
}

/** D1 que falla en cualquier consulta, para probar caminos de error. */
export function crearD1QueFalla(mensaje = 'D1 no disponible'): D1Database {
  return {
    prepare() {
      const fallar = async () => {
        throw new Error(mensaje);
      };
      const sentencia = { all: fallar, first: fallar, run: fallar };
      return { ...sentencia, bind: () => sentencia };
    },
  } as unknown as D1Database;
}
