import { describe, expect, it } from 'vitest';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import { ContrasenaPlana } from '../dominio/objeto-valor/contrasena-plana';
import { CifradorPbkdf2 } from './cifrador-pbkdf2';

const cifrador = new CifradorPbkdf2();

describe('CifradorPbkdf2 (KAN-16 · Escenario 5)', () => {
  it('guarda un hash con sal y nunca la contraseña', async () => {
    const guardada = await cifrador.cifrar(ContrasenaPlana.crear('clave123'));
    const valor = guardada.obtenerHashParaGuardar();

    expect(valor).toMatch(/^pbkdf2_sha256\$100000\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(valor).not.toContain('clave123');
  });

  it('la misma contraseña produce hashes distintos gracias a la sal', async () => {
    const primera = await cifrador.cifrar(ContrasenaPlana.crear('clave123'));
    const segunda = await cifrador.cifrar(ContrasenaPlana.crear('clave123'));

    expect(primera.obtenerHashParaGuardar()).not.toBe(segunda.obtenerHashParaGuardar());
  });

  it('reconoce la contraseña correcta y rechaza las demás', async () => {
    const guardada = await cifrador.cifrar(ContrasenaPlana.crear('clave123'));

    expect(await cifrador.coincide('clave123', guardada)).toBe(true);
    expect(await cifrador.coincide('clave124', guardada)).toBe(false);
    expect(await cifrador.coincide('', guardada)).toBe(false);
    expect(cifrador.necesitaActualizarse(guardada)).toBe(false);
  });

  it('acepta las cuentas antiguas sin hash y pide volver a cifrarlas', async () => {
    const heredada = ContrasenaCifrada.desdeHash('balon2026');

    expect(await cifrador.coincide('balon2026', heredada)).toBe(true);
    expect(await cifrador.coincide('otra2026', heredada)).toBe(false);
    expect(cifrador.necesitaActualizarse(heredada)).toBe(true);
  });

  it('pide volver a cifrar los hashes con menos iteraciones que las actuales', () => {
    const debil = ContrasenaCifrada.desdeHash('pbkdf2_sha256$1000$c2Fs$aGFzaA==');

    expect(cifrador.necesitaActualizarse(debil)).toBe(true);
  });
});
