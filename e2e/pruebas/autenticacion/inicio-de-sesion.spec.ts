import { unJugador } from '../../dominio/fabricas/fabrica-de-usuarios';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-17 · Inicio y cierre de sesión', () => {
  test('el jugador entra a su inicio aunque escriba el correo en mayúsculas', async ({
    page,
    escenarios,
    iniciarSesion,
    inicioDelJugador,
  }) => {
    const jugador = await escenarios.jugadorRegistrado();

    await iniciarSesion.abrir();
    await iniciarSesion.iniciarSesionCon({
      correo: jugador.correo.toUpperCase(),
      contrasena: jugador.contrasena,
    });

    await expect(page).toHaveURL(/\/inicio$/);
    await expect(inicioDelJugador.nombreDelJugador).toHaveText(jugador.nombreCompleto);
  });

  test('el administrador entra a Gestión de torneos', async ({
    page,
    escenarios,
    iniciarSesion,
    gestionDeTorneos,
  }) => {
    const admin = await escenarios.administradorRegistrado();

    await iniciarSesion.abrir();
    await iniciarSesion.iniciarSesionCon(admin);

    await expect(page).toHaveURL(/\/admin\/torneos$/);
    await expect(gestionDeTorneos.titulo).toBeVisible();
    await expect(gestionDeTorneos.saludo).toHaveText(`Hola, ${admin.nombreCompleto}`);
  });

  test('con credenciales incorrectas muestra un mensaje que no revela cuál falló', async ({
    page,
    escenarios,
    iniciarSesion,
  }) => {
    const jugador = await escenarios.jugadorRegistrado();
    const mensajeEsperado = 'Correo o contraseña incorrectos';

    await test.step('Con la contraseña equivocada', async () => {
      await iniciarSesion.abrir();
      await iniciarSesion.iniciarSesionCon({ correo: jugador.correo, contrasena: 'Equivocada1' });
      await expect(iniciarSesion.avisoDeError).toContainText(mensajeEsperado);
    });

    await test.step('Con un correo que no existe, el mismo mensaje', async () => {
      await iniciarSesion.iniciarSesionCon({
        correo: unJugador().construir().correo,
        contrasena: jugador.contrasena,
      });
      await expect(iniciarSesion.avisoDeError).toContainText(mensajeEsperado);
    });

    await expect(page).toHaveURL(/\/iniciar-sesion$/);
  });

  test('una cuenta desactivada no puede entrar', async ({ escenarios, iniciarSesion }) => {
    const desactivado = await escenarios.jugadorRegistrado(unJugador().desactivado().construir());

    await iniciarSesion.abrir();
    await iniciarSesion.iniciarSesionCon(desactivado);

    await expect(iniciarSesion.avisoDeError).toContainText('desactivada');
  });

  test('al cerrar sesión las pantallas privadas vuelven a pedir inicio de sesión', async ({
    page,
    escenarios,
    sesion,
    inicioDelJugador,
    iniciarSesion,
  }) => {
    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    await test.step('Cuando cierra sesión', async () => {
      await inicioDelJugador.cerrarSesion();
      await expect(iniciarSesion.titulo).toBeVisible();
    });

    await test.step('Entonces volver a su inicio lo lleva a Iniciar sesión', async () => {
      await inicioDelJugador.abrir();
      await expect(page).toHaveURL(/\/iniciar-sesion$/);
    });
  });

  test('sin sesión, una pantalla privada redirige a Iniciar sesión', async ({ page, miPerfil }) => {
    await miPerfil.abrir();

    await expect(page).toHaveURL(/\/iniciar-sesion$/);
  });
});
