import { unAdministrador } from '../../dominio/fabricas/fabrica-de-usuarios';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-18 · Registro de administradores', () => {
  test('un administrador registra a otro, que debe cambiar la contraseña temporal al entrar', async ({
    page,
    escenarios,
    sesion,
    gestionDeTorneos,
    registrarAdministrador,
    iniciarSesion,
    cambiarContrasena,
    almacen,
  }) => {
    const nuevoAdmin = unAdministrador().conNombre('Andrea Martínez').construir();
    let contrasenaTemporal = '';
    await sesion.iniciarComo(await escenarios.administradorRegistrado());

    await test.step('Cuando registra un administrador nuevo', async () => {
      await gestionDeTorneos.irARegistrarAdministrador();
      await expect(registrarAdministrador.titulo).toBeVisible();
      await registrarAdministrador.registrar(nuevoAdmin);
    });

    await test.step('Entonces ve una contraseña temporal de 12 caracteres', async () => {
      await expect(registrarAdministrador.dialogoAdministradorRegistrado).toBeVisible();
      contrasenaTemporal = await registrarAdministrador.contrasenaTemporal();
      expect(contrasenaTemporal).toHaveLength(12);
      await registrarAdministrador.cerrarDialogo();
    });

    await test.step('Y la cuenta queda como admin con cambio de contraseña pendiente', async () => {
      const guardado = await almacen.buscarUsuarioPorCorreo(nuevoAdmin.correo);
      expect(guardado).toMatchObject({ rol: 'admin', debeCambiarContrasena: true });
    });

    await test.step('Cuando el nuevo administrador entra con la contraseña temporal', async () => {
      await gestionDeTorneos.abrir();
      await gestionDeTorneos.cerrarSesion();
      await iniciarSesion.iniciarSesionCon({
        correo: nuevoAdmin.correo,
        contrasena: contrasenaTemporal,
      });
    });

    await test.step('Entonces la app lo obliga a cambiarla antes de continuar', async () => {
      await expect(cambiarContrasena.titulo).toBeVisible();
      await cambiarContrasena.cambiar(contrasenaTemporal, 'Arbitro2026');
      await expect(page).toHaveURL(/\/admin$/);
    });
  });

  test('si el correo es de un jugador, ofrece promoverlo a administrador', async ({
    escenarios,
    sesion,
    registrarAdministrador,
    almacen,
  }) => {
    const jugador = await escenarios.jugadorRegistrado();
    await sesion.iniciarComo(await escenarios.administradorRegistrado());

    await test.step('Cuando intenta registrar como admin el correo de un jugador', async () => {
      await registrarAdministrador.abrir();
      await registrarAdministrador.registrar(jugador);
    });

    await test.step('Entonces ve el diálogo de promoción y lo promueve', async () => {
      await expect(registrarAdministrador.dialogoDePromocion).toContainText(jugador.nombreCompleto);
      await registrarAdministrador.promoverAlJugador();
      await expect(registrarAdministrador.dialogoDePromocion).toBeHidden();
    });

    await test.step('Y el jugador queda como administrador', async () => {
      await expect
        .poll(async () => (await almacen.buscarUsuarioPorCorreo(jugador.correo))?.rol)
        .toBe('admin');
    });
  });

  test('no permite promover a un jugador que está en un torneo en curso', async ({
    escenarios,
    sesion,
    registrarAdministrador,
    almacen,
  }) => {
    const jugador = await escenarios.jugadorEnTorneoEnCurso();
    await sesion.iniciarComo(await escenarios.administradorRegistrado());

    await registrarAdministrador.abrir();
    await registrarAdministrador.registrar(jugador);
    await registrarAdministrador.promoverAlJugador();

    await expect(registrarAdministrador.avisoDeError).toContainText('torneo en curso');
    expect((await almacen.buscarUsuarioPorCorreo(jugador.correo))?.rol).toBe('jugador');
  });

  test('un jugador no puede entrar a las pantallas de administración', async ({
    page,
    escenarios,
    sesion,
    registrarAdministrador,
  }) => {
    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    await registrarAdministrador.abrir();

    await expect(page).toHaveURL(/\/inicio$/);
  });
});
