import { describe, expect, it } from 'vitest';
import { sembrarPrimerAdministrador } from '../../../seeds/seed-admin';
import { crearD1DeAutenticacion, crearUsuarioGuardado } from './d1-de-autenticacion';

describe('sembrarPrimerAdministrador (KAN-18 · Escenario 6 · Idempotencia)', () => {
  it('crea el primer administrador cuando la tabla no tiene admins', async () => {
    const { db, usuarios } = crearD1DeAutenticacion([]);

    const resultado = await sembrarPrimerAdministrador(db, {
      nombre: 'Admin Fundador',
      correo: 'admin@unbosque.edu.co',
      telefono: '3001234567',
    });

    expect(resultado.creado).toBe(true);
    expect(resultado.adminId).toBeDefined();
    expect(resultado.contrasenaTemporal).toHaveLength(12);

    expect(usuarios).toHaveLength(1);
    const admin = usuarios[0]!;
    expect(admin.rol).toBe('admin');
    expect(admin.correo).toBe('admin@unbosque.edu.co');
    expect(admin.debe_cambiar_contrasena).toBe(1);
    expect(admin.activo).toBe(1);
  });

  it('es idempotente: no crea duplicados si ya existe un administrador', async () => {
    const { db, usuarios } = crearD1DeAutenticacion([
      crearUsuarioGuardado({
        id: 'admin-existente',
        rol: 'admin',
        correo: 'admin@unbosque.edu.co',
      }),
    ]);

    const resultado = await sembrarPrimerAdministrador(db, {
      nombre: 'Otro Admin',
      correo: 'admin@unbosque.edu.co',
    });

    expect(resultado.creado).toBe(false);
    expect(resultado.mensaje).toContain('Ya existe un administrador');
    expect(resultado.adminId).toBeUndefined();
    expect(resultado.contrasenaTemporal).toBeUndefined();

    // No se agregó ningún usuario nuevo
    expect(usuarios).toHaveLength(1);
  });
});
