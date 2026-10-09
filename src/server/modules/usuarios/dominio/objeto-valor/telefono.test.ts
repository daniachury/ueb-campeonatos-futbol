import { describe, expect, it } from 'vitest';
import { Telefono } from './telefono';

const MENSAJE_TELEFONO_INVALIDO = 'Ingresa un teléfono válido (7 a 15 dígitos)';

describe('Telefono', () => {
    describe('valores límite de dígitos (KAN-16)', () => {
        it('rechaza 6 dígitos', () => {
            expect(() => Telefono.crear('300123')).toThrow(MENSAJE_TELEFONO_INVALIDO);
        });

        it('acepta 7 dígitos', () => {
            expect(Telefono.crear('3001234').valor).toBe('3001234');
        });

        it('acepta 15 dígitos', () => {
            expect(Telefono.crear('300123456789012').valor).toBe('300123456789012');
        });

        it('rechaza 16 dígitos', () => {
            expect(() => Telefono.crear('3001234567890123')).toThrow(MENSAJE_TELEFONO_INVALIDO);
        });
    });

    it('acepta un "+" inicial para el indicativo', () => {
        expect(Telefono.crear('+573001234567').valor).toBe('+573001234567');
    });

    it('no cuenta el "+" como dígito', () => {
        expect(() => Telefono.crear('+3001234567890123')).toThrow(MENSAJE_TELEFONO_INVALIDO);
    });

    it('rechaza letras (Escenario 3)', () => {
        expect(() => Telefono.crear('300abc')).toThrow(MENSAJE_TELEFONO_INVALIDO);
    });

    it('rechaza un "+" que no esté al inicio', () => {
        expect(() => Telefono.crear('57+3001234567')).toThrow(MENSAJE_TELEFONO_INVALIDO);
    });

    it('quita los espacios alrededor', () => {
        expect(Telefono.crear(' 3001234567 ').valor).toBe('3001234567');
    });
});