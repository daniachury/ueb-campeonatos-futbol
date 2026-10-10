import { describe, expect, it } from 'vitest';
import {
  esquemaSolicitudRegistroJugador,
  validarFormularioRegistro,
  type ValoresFormularioRegistro,
} from './esquema-registro-jugador';

const FORMULARIO_VALIDO: ValoresFormularioRegistro = {
  nombreCompleto: 'Laura Gómez',
  correo: 'laura@mail.com',
  telefono: '3001234567',
  contrasena: 'clave123',
  confirmarContrasena: 'clave123',
};

function validarCambiando(cambios: Partial<ValoresFormularioRegistro>) {
  return validarFormularioRegistro({ ...FORMULARIO_VALIDO, ...cambios });
}

describe('validarFormularioRegistro', () => {
  it('no reporta errores cuando todo es válido', () => {
    expect(validarFormularioRegistro(FORMULARIO_VALIDO)).toEqual({});
  });

  describe('valores límite del nombre (KAN-16)', () => {
    it.each([
      { caso: '2 caracteres', nombreCompleto: 'Al', esValido: false },
      { caso: '3 caracteres', nombreCompleto: 'Ana', esValido: true },
      { caso: '80 caracteres', nombreCompleto: 'a'.repeat(80), esValido: true },
      { caso: '81 caracteres', nombreCompleto: 'a'.repeat(81), esValido: false },
    ])('$caso → válido: $esValido', ({ nombreCompleto, esValido }) => {
      const errores = validarCambiando({ nombreCompleto });

      expect(errores.nombreCompleto === undefined).toBe(esValido);
    });
  });

  describe('valores límite del teléfono (KAN-16)', () => {
    it.each([
      { caso: '6 dígitos', telefono: '300123', esValido: false },
      { caso: '7 dígitos', telefono: '3001234', esValido: true },
      { caso: '15 dígitos', telefono: '300123456789012', esValido: true },
      { caso: '16 dígitos', telefono: '3001234567890123', esValido: false },
    ])('$caso → válido: $esValido', ({ telefono, esValido }) => {
      const errores = validarCambiando({ telefono });

      expect(errores.telefono === undefined).toBe(esValido);
    });
  });

  it('usa el mensaje exacto de Jira para un teléfono con letras (Escenario 3)', () => {
    expect(validarCambiando({ telefono: '300abc' }).telefono).toBe(
      'Ingresa un teléfono válido (7 a 15 dígitos)',
    );
  });

  it('avisa que las contraseñas no coinciden aunque otro campo tenga errores', () => {
    const errores = validarCambiando({ nombreCompleto: '', confirmarContrasena: 'otra1234' });

    expect(errores.nombreCompleto).toBe('Ingresa tu nombre completo (3 a 80 caracteres)');
    expect(errores.confirmarContrasena).toBe('Las contraseñas no coinciden');
  });

  it('marca todos los campos cuando el formulario está vacío', () => {
    const errores = validarFormularioRegistro({
      nombreCompleto: '',
      correo: '',
      telefono: '',
      contrasena: '',
      confirmarContrasena: '',
    });

    expect(Object.keys(errores)).toEqual(['nombreCompleto', 'correo', 'telefono', 'contrasena']);
  });
});

describe('esquemaSolicitudRegistroJugador', () => {
  it('normaliza los datos y descarta lo que no es parte de la solicitud (Escenarios 1 y 4)', () => {
    const cuerpoRecibido = {
      ...FORMULARIO_VALIDO,
      nombreCompleto: '  Laura   Gómez ',
      correo: 'Laura@Mail.com ',
      rol: 'administrador',
    };

    expect(esquemaSolicitudRegistroJugador.parse(cuerpoRecibido)).toEqual({
      nombreCompleto: 'Laura Gómez',
      correo: 'laura@mail.com',
      telefono: '3001234567',
      contrasena: 'clave123',
    });
  });
});
