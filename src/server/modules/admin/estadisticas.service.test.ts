import { describe, expect, it } from 'vitest';
import { crearD1Falsa, crearD1QueFalla } from '../../test/d1-falsa';
import { crearEstadisticasAdminService } from './estadisticas.service';

describe('EstadisticasAdminService (Métricas reales en /admin)', () => {
  it('obtiene los conteos reales de la base de datos D1', async () => {
    const { db } = crearD1Falsa(() => [
      {
        torneos: 4,
        equipos: 5,
        partidos: 3,
        jugadores: 52,
        pendientes: 2,
      },
    ]);

    const service = crearEstadisticasAdminService(db);
    const resultado = await service.obtenerResumen();

    expect(resultado).toEqual({
      torneos: 4,
      equipos: 5,
      partidos: 3,
      jugadores: 52,
      pendientes: 2,
    });
  });

  it('devuelve ceros si la base de datos responde vacía', async () => {
    const { db } = crearD1Falsa(() => []);

    const service = crearEstadisticasAdminService(db);
    const resultado = await service.obtenerResumen();

    expect(resultado).toEqual({
      torneos: 0,
      equipos: 0,
      partidos: 0,
      jugadores: 0,
      pendientes: 0,
    });
  });

  it('propaga el error si la base de datos D1 falla', async () => {
    const db = crearD1QueFalla('Fallo de conexión D1');
    const service = crearEstadisticasAdminService(db);

    await expect(service.obtenerResumen()).rejects.toThrow('Fallo de conexión D1');
  });
});
