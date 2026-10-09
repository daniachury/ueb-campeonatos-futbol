import { describe, expect, it } from 'vitest';
import { ErrorDeValidacionDeDominio } from '../errores/error-de-validacion-dominio';
import { NombreCompleto } from './nombre-completo';

const MENSAJE_NOMBRE_INVALIDO = 'Ingresa tu nombre completo (3 a 80 caracteres)';

describe('NombreCompleto', () => {
    describe('valores límite de longitud (KAN-16)', () => {
        it('rechaza un nombre de 2 caracteres', () => {
            expect(() => NombreCompleto.crear('Al')).toThrow(MENSAJE_NOMBRE_INVALIDO);
        });

        it('acepta un nombre de 3 caracteres', () => {
            expect(NombreCompleto.crear('Ana').valor).toBe('Ana');
        });

        it('acepta un nombre de 80 caracteres', () => {
            const nombreDe80Caracteres = 'a'.repeat(80);
            expect(NombreCompleto.crear(nombreDe80Caracteres).valor).toBe(nombreDe80Caracteres);
        });

        it('rechaza un nombre de 81 caracteres', () => {
            expect(() => NombreCompleto.crear('a'.repeat(81))).toThrow(MENSAJE_NOMBRE_INVALIDO);
        });
    });

    it('acepta letras con tildes, ñ y espacios', () => {
        expect(NombreCompleto.crear('José Peña Núñez').valor).toBe('José Peña Núñez');
    });

    it('rechaza números y símbolos', () => {
        expect(() => NombreCompleto.crear('Laura2')).toThrow(MENSAJE_NOMBRE_INVALIDO);
        expect(() => NombreCompleto.crear('Laura_Gómez')).toThrow(MENSAJE_NOMBRE_INVALIDO);
    });

    it('normaliza los espacios sobrantes', () => {
        expect(NombreCompleto.crear('  Laura   Gómez ').valor).toBe('Laura Gómez');
    });

    it('indica el campo afectado en el error', () => {
        try {
            NombreCompleto.crear('');
            expect.unreachable('debió lanzar un error');
        } catch (error) {
            expect(error).toBeInstanceOf(ErrorDeValidacionDeDominio);
            expect((error as ErrorDeValidacionDeDominio).campo).toBe('nombreCompleto');
        }
    });

    it('obtiene el primer nombre para el saludo de bienvenida', () => {
        expect(NombreCompleto.crear('Laura Gómez').primerNombre).toBe('Laura');
    });
});