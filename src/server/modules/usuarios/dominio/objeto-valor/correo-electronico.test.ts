import { describe, expect, it } from 'vitest';
import { CorreoElectronico } from './correo-electronico';

const MENSAJE_CORREO_INVALIDO = 'Ingresa un correo válido';

describe('CorreoElectronico', () => {
  it('se guarda en minúsculas y sin espacios alrededor (Escenario 1)', () => {
    expect(CorreoElectronico.crear('Laura@Mail.com ').valor).toBe('laura@mail.com');
  });

  it('considera iguales dos correos que solo difieren en mayúsculas (base del Escenario 2)', () => {
    const correoRegistrado = CorreoElectronico.crear('laura@mail.com');
    const correoNuevo = CorreoElectronico.crear('LAURA@mail.com');

    expect(correoNuevo.esIgualA(correoRegistrado)).toBe(true);
  });

  it.each(['laura', 'laura@', 'laura@mail', '@mail.com', 'lau ra@mail.com', 'laura@mail.c'])(
    'rechaza el formato inválido "%s"',
    (correoInvalido: string) => {
      expect(() => CorreoElectronico.crear(correoInvalido)).toThrow(MENSAJE_CORREO_INVALIDO);
    },
  );
});
