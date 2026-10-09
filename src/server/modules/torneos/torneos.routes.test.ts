import { describe, expect, it } from 'vitest';
import type { ErrorApi, ErrorDeCampo, RespuestaLista } from '@shared/api';
import type { TorneoResumen } from '@shared/torneos';
import { crearApp } from '../../app';
import { crearD1Falsa } from '../../test/d1-falsa';

const filas: TorneoResumen[] = [
  { id: 't1', nombre: 'Liga 2025', estado: 'FINALIZADO', fechaInicio: '2025-08-01', cupo: 6 },
  {
    id: 't2',
    nombre: 'Copa El Bosque 2026',
    estado: 'INSCRIPCIONES_ABIERTAS',
    fechaInicio: '2026-11-07',
    cupo: 8,
  },
  {
    id: 't3',
    nombre: 'Liga Interfacultades',
    estado: 'EN_CURSO',
    fechaInicio: '2026-10-17',
    cupo: 10,
  },
];

describe('GET /api/torneos', () => {
  it('responde 200 con los torneos públicos ordenados', async () => {
    const { db, consultas } = crearD1Falsa(() => filas);

    const respuesta = await crearApp().request('/api/torneos', {}, { DB: db });
    const cuerpo = (await respuesta.json()) as RespuestaLista<TorneoResumen>;

    expect(respuesta.status).toBe(200);
    expect(cuerpo.datos.map((t) => t.id)).toEqual(['t2', 't3', 't1']);
    expect(consultas[0]?.parametros).toEqual(['INSCRIPCIONES_ABIERTAS', 'EN_CURSO', 'FINALIZADO']);
  });

  it('aplica el filtro por estado', async () => {
    const { db, consultas } = crearD1Falsa(() => []);

    const respuesta = await crearApp().request('/api/torneos?estado=EN_CURSO', {}, { DB: db });

    expect(respuesta.status).toBe(200);
    expect(consultas[0]?.parametros).toEqual(['EN_CURSO']);
  });

  it('rechaza con 400 un estado que no es público, sin consultar la base de datos', async () => {
    const { db, consultas } = crearD1Falsa();

    const respuesta = await crearApp().request('/api/torneos?estado=BORRADOR', {}, { DB: db });
    const cuerpo = (await respuesta.json()) as ErrorApi;

    expect(respuesta.status).toBe(400);
    expect(cuerpo.codigo).toBe('VALIDACION');
    expect((cuerpo.detalles as ErrorDeCampo[])[0]?.campo).toBe('estado');
    expect(consultas).toHaveLength(0);
  });
});
