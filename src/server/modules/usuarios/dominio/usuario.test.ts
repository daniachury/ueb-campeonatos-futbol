import { describe, expect, it } from 'vitest';
import { ROLES } from './rol';
import { Usuario, type DatosParaRegistrarJugador } from './usuario';
import { ContrasenaCifrada } from './objeto-valor/contrasena-cifrada';
import { CorreoElectronico } from './objeto-valor/correo-electronico';
import { NombreCompleto } from './objeto-valor/nombre-completo';
import { Telefono } from './objeto-valor/telefono';

const HASH_DE_PRUEBA = '$2b$10$hashDePruebaQueNuncaDebeSalirEnUnaRespuesta';
const FECHA_DE_REGISTRO = new Date('2026-10-08T20:00:00-05:00');

function crearDatosDeRegistroDeLaura(): DatosParaRegistrarJugador {
  return {
    id: 'usuario-123',
    nombreCompleto: NombreCompleto.crear('Laura Gómez'),
    correo: CorreoElectronico.crear('Laura@Mail.com '),
    telefono: Telefono.crear('3001234567'),
    contrasenaCifrada: ContrasenaCifrada.desdeHash(HASH_DE_PRUEBA),
    fechaDeRegistro: FECHA_DE_REGISTRO,
  };
}

describe('Usuario.registrarJugador', () => {
  it('crea la cuenta con rol Jugador, activa y con el correo normalizado (Escenario 1)', () => {
    const laura = Usuario.registrarJugador(crearDatosDeRegistroDeLaura());

    expect(laura.rol).toBe(ROLES.JUGADOR);
    expect(laura.esJugador()).toBe(true);
    expect(laura.activo).toBe(true);
    expect(laura.correo.valor).toBe('laura@mail.com');
    expect(laura.creadoEn).toEqual(FECHA_DE_REGISTRO);
    expect(laura.actualizadoEn).toEqual(FECHA_DE_REGISTRO);
  });

  it('ignora un rol administrador colado en los datos (Escenario 4)', () => {
    const datosManipulados = { ...crearDatosDeRegistroDeLaura(), rol: ROLES.ADMINISTRADOR };

    const usuario = Usuario.registrarJugador(datosManipulados);

    expect(usuario.rol).toBe(ROLES.JUGADOR);
  });

  it('nunca incluye el hash al convertirse a JSON (Escenario 5)', () => {
    const laura = Usuario.registrarJugador(crearDatosDeRegistroDeLaura());

    const usuarioComoJson = JSON.stringify(laura);

    expect(usuarioComoJson).not.toContain(HASH_DE_PRUEBA);
    expect(usuarioComoJson).toContain('laura@mail.com');
  });
});
