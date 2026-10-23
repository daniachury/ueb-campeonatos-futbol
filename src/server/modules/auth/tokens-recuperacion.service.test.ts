import { describe, expect, it } from 'vitest';
import { MENSAJES_RECUPERACION } from '@shared/usuarios/contrato-recuperacion-cuenta';
import { CifradorPbkdf2 } from '../usuarios/infraestructura/cifrador-pbkdf2';
import { RepositorioDeUsuariosD1 } from '../usuarios/infraestructura/repositorio-de-usuarios-d1';
import {
  crearD1DeAutenticacion,
  crearUsuarioGuardado,
} from '../../test/d1-de-autenticacion';
import { crearTokensRecuperacionRepository } from './tokens-recuperacion.repository';
import { crearTokensRecuperacionService } from './tokens-recuperacion.service';

describe('TokensRecuperacionService (KAN-50)', () => {
  it('genera enlace y token válido para un usuario existente (Escenario 1)', async () => {
    const usuario = crearUsuarioGuardado({
      id: 'usr-1',
      correo: 'capitan@unbosque.edu.co',
      rol: 'jugador',
    });
    const { db, tokensRecuperacion } = crearD1DeAutenticacion([usuario]);
    const servicio = crearTokensRecuperacionService(
      crearTokensRecuperacionRepository(db),
      new RepositorioDeUsuariosD1(db),
      new CifradorPbkdf2(),
    );

    const resultado = await servicio.solicitarRecuperacion('capitan@unbosque.edu.co');

    expect(resultado.token).toBeDefined();
    expect(resultado.enlace).toBe(`/restablecer-contrasena?token=${resultado.token}`);
    expect(tokensRecuperacion).toHaveLength(1);
    expect(tokensRecuperacion[0]?.usuario_id).toBe('usr-1');
    expect(tokensRecuperacion[0]?.usado).toBe(0);
  });

  it('rechaza correos que no existen o están inactivos con 404 (Escenario 2)', async () => {
    const { db } = crearD1DeAutenticacion([]);
    const servicio = crearTokensRecuperacionService(
      crearTokensRecuperacionRepository(db),
      new RepositorioDeUsuariosD1(db),
      new CifradorPbkdf2(),
    );

    await expect(servicio.solicitarRecuperacion('inexistente@unbosque.edu.co')).rejects.toThrow(
      MENSAJES_RECUPERACION.CORREO_NO_ENCONTRADO,
    );
  });

  it('valida token existente y no vencido (Escenario 1 y 6)', async () => {
    const usuario = crearUsuarioGuardado({
      id: 'usr-2',
      correo: 'admin@unbosque.edu.co',
      rol: 'admin',
    });
    const { db } = crearD1DeAutenticacion([usuario]);
    const servicio = crearTokensRecuperacionService(
      crearTokensRecuperacionRepository(db),
      new RepositorioDeUsuariosD1(db),
      new CifradorPbkdf2(),
    );

    const { token } = await servicio.solicitarRecuperacion('admin@unbosque.edu.co');
    const validacion = await servicio.validarToken(token);

    expect(validacion.valido).toBe(true);
    expect(validacion.correo).toBe('admin@unbosque.edu.co');
  });

  it('rechaza token vencido (> 60 min) con 400 (Escenario 6)', async () => {
    const usuario = crearUsuarioGuardado({
      id: 'usr-3',
      correo: 'vencido@unbosque.edu.co',
    });
    const ahora = new Date('2026-10-21T10:00:00.000Z');
    const { db } = crearD1DeAutenticacion([usuario]);
    const servicio = crearTokensRecuperacionService(
      crearTokensRecuperacionRepository(db),
      new RepositorioDeUsuariosD1(db),
      new CifradorPbkdf2(),
      () => ahora,
    );

    const { token } = await servicio.solicitarRecuperacion('vencido@unbosque.edu.co');

    // Adelantar el reloj 61 minutos
    const servicioFuturo = crearTokensRecuperacionService(
      crearTokensRecuperacionRepository(db),
      new RepositorioDeUsuariosD1(db),
      new CifradorPbkdf2(),
      () => new Date(ahora.getTime() + 61 * 60 * 1000),
    );

    await expect(servicioFuturo.validarToken(token)).rejects.toThrow(
      MENSAJES_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO,
    );
  });

  it('restablece la contraseña, marca el token como usado y revoca sesiones (Escenario 5)', async () => {
    const usuario = crearUsuarioGuardado({
      id: 'usr-4',
      correo: 'cambio@unbosque.edu.co',
      hash_contrasena: 'claveVieja123',
    });
    const { db, sesiones, tokensRecuperacion, usuarios } = crearD1DeAutenticacion([usuario]);
    // Agregar una sesión previa activa para el usuario
    sesiones.push({
      usuario_id: 'usr-4',
      hash_token: 'hash_sesion_activa',
      expira_en: new Date(Date.now() + 86400000).toISOString(),
    });

    const servicio = crearTokensRecuperacionService(
      crearTokensRecuperacionRepository(db),
      new RepositorioDeUsuariosD1(db),
      new CifradorPbkdf2(),
    );

    const { token } = await servicio.solicitarRecuperacion('cambio@unbosque.edu.co');
    await servicio.restablecerContrasena(token, 'NuevaClave2026');

    // Verificar contraseña actualizada
    const usuarioActualizado = usuarios.find((u) => u.id === 'usr-4');
    expect(usuarioActualizado?.hash_contrasena).not.toBe('claveVieja123');
    expect(usuarioActualizado?.hash_contrasena).toMatch(/^pbkdf2_sha256\$/);

    // Verificar token marcado como usado
    expect(tokensRecuperacion[0]?.usado).toBe(1);

    // Verificar sesiones revocadas
    expect(sesiones.filter((s) => s.usuario_id === 'usr-4')).toHaveLength(0);

    // Intentar reutilizar el token debe fallar
    await expect(servicio.restablecerContrasena(token, 'OtraClave2026')).rejects.toThrow(
      MENSAJES_RECUPERACION.TOKEN_INVALIDO_O_EXPIRADO,
    );
  });
});
