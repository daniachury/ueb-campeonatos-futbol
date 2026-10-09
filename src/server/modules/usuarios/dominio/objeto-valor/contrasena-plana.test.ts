import { describe, expect, it } from 'vitest';
import { ContrasenaPlana } from './contrasena-plana';

const MENSAJE_CONTRASENA_INVALIDA =
    'La contraseña debe tener mínimo 8 caracteres, con letras y números';

describe('ContrasenaPlana', () => {
    it('acepta 8 caracteres con letras y números', () => {
        expect(() => ContrasenaPlana.crear('clave123')).not.toThrow();
    });

    it('rechaza 7 caracteres', () => {
        expect(() => ContrasenaPlana.crear('clave12')).toThrow(MENSAJE_CONTRASENA_INVALIDA);
    });

    it('rechaza una contraseña sin números', () => {
        expect(() => ContrasenaPlana.crear('solamenteletras')).toThrow(MENSAJE_CONTRASENA_INVALIDA);
    });

    it('rechaza una contraseña sin letras', () => {
        expect(() => ContrasenaPlana.crear('12345678')).toThrow(MENSAJE_CONTRASENA_INVALIDA);
    });

    it('no se filtra al imprimirla ni al convertirla a JSON', () => {
        const contrasena = ContrasenaPlana.crear('clave123');

        expect(String(contrasena)).not.toContain('clave123');
        expect(JSON.stringify({ contrasena })).not.toContain('clave123');
    });

    it('entrega el texto original solo a quien la va a cifrar', () => {
        expect(ContrasenaPlana.crear('clave123').revelarParaCifrar()).toBe('clave123');
    });
});