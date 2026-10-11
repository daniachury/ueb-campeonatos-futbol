import { describe, expect, it } from 'vitest';
import {
  validarCondicionesDeInscripcion,
  validarTorneoPermiteModificacion,
  type ParametrosValidacionInscripcion,
} from './validador-inscripciones';

describe('validador-inscripciones (dominio)', () => {
  const paramsValidos: ParametrosValidacionInscripcion = {
    torneoEstado: 'INSCRIPCIONES_ABIERTAS',
    equiposAprobados: 5,
    cupo: 8,
    cantidadJugadores: 14,
    conflictos: [],
  };

  it('permite inscripción cuando cumple las 4 validaciones', () => {
    expect(() => validarCondicionesDeInscripcion(paramsValidos)).not.toThrow();
  });

  it('rechaza si el torneo no está en inscripciones abiertas (Condición 1)', () => {
    expect(() =>
      validarCondicionesDeInscripcion({ ...paramsValidos, torneoEstado: 'BORRADOR' }),
    ).toThrowError('Las inscripciones de este torneo están cerradas');

    expect(() =>
      validarCondicionesDeInscripcion({ ...paramsValidos, torneoEstado: 'EN_CURSO' }),
    ).toThrowError('Las inscripciones de este torneo están cerradas');
  });

  it('rechaza si el cupo está completo (Condición 2)', () => {
    expect(() =>
      validarCondicionesDeInscripcion({ ...paramsValidos, equiposAprobados: 8, cupo: 8 }),
    ).toThrowError('El torneo ya completó su cupo (8/8)');
  });

  it('rechaza si el equipo tiene menos de 11 jugadores (Condición 3)', () => {
    expect(() =>
      validarCondicionesDeInscripcion({ ...paramsValidos, cantidadJugadores: 10 }),
    ).toThrowError('El equipo tiene 10 jugadores; se necesitan al menos 11');
  });

  it('rechaza si el equipo tiene más de 25 jugadores (Condición 3)', () => {
    expect(() =>
      validarCondicionesDeInscripcion({ ...paramsValidos, cantidadJugadores: 26 }),
    ).toThrowError('El equipo tiene 26 jugadores; el máximo permitido es 25');
  });

  it('rechaza si existen jugadores en conflicto en el mismo torneo (Condición 4)', () => {
    expect(() =>
      validarCondicionesDeInscripcion({
        ...paramsValidos,
        conflictos: [
          {
            jugadorId: 'j-1',
            nombreJugador: 'Carlos Pérez',
            otroEquipoId: 'eq-2',
            otroEquipoNombre: 'Halcones FC',
          },
        ],
      }),
    ).toThrowError('Jugadores en conflicto: Carlos Pérez (Halcones FC)');
  });

  it('validarTorneoPermiteModificacion rechaza torneos en curso o finalizados', () => {
    expect(() => validarTorneoPermiteModificacion('INSCRIPCIONES_ABIERTAS')).not.toThrow();
    expect(() => validarTorneoPermiteModificacion('EN_CURSO')).toThrowError(
      'No se pueden modificar inscripciones cuando el torneo está en curso o finalizado',
    );
    expect(() => validarTorneoPermiteModificacion('FINALIZADO')).toThrowError(
      'No se pueden modificar inscripciones cuando el torneo está en curso o finalizado',
    );
  });
});
