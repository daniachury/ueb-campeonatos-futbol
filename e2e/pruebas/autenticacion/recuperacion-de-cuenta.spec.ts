import { unJugador } from '../../dominio/fabricas/fabrica-de-usuarios';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-50 · Recuperación de cuenta y restablecimiento de contraseña', () => {
  test('el enlace de olvido de contraseña es visible en Iniciar Sesión y navega a Recuperar Cuenta', async ({
    page,
    iniciarSesion,
    recuperarCuenta,
  }) => {
    await iniciarSesion.abrir();

    await expect(iniciarSesion.enlaceOlvidoContrasena).toBeVisible();
    await iniciarSesion.irARecuperarCuenta();

    await expect(page).toHaveURL(/\/recuperar-cuenta$/);
    await expect(recuperarCuenta.titulo).toBeVisible();
    await expect(recuperarCuenta.campoCorreo).toBeVisible();
    await expect(recuperarCuenta.botonGenerar).toBeVisible();
  });

  test('un jugador registrado solicita recuperar su cuenta y puede restablecer su contraseña', async ({
    page,
    escenarios,
    recuperarCuenta,
    restablecerContrasena,
    iniciarSesion,
    inicioDelJugador,
  }) => {
    const jugador = await escenarios.jugadorRegistrado();
    const nuevaContrasena = 'NuevaClave2026';

    await test.step('1. Solicitar enlace de recuperación en pantalla', async () => {
      await recuperarCuenta.abrir();
      await recuperarCuenta.solicitarRecuperacion(jugador.correo);

      await expect(recuperarCuenta.botonIrARestablecer).toBeVisible();
    });

    await test.step('2. Redirección inmediata a restablecer contraseña', async () => {
      await recuperarCuenta.botonIrARestablecer.click();
      await expect(page).toHaveURL(/\/restablecer-contrasena\?token=.+/);
      await expect(restablecerContrasena.titulo).toBeVisible();
      await expect(restablecerContrasena.campoNuevaContrasena).toBeVisible();
    });

    await test.step('3. Restablecer la contraseña con nueva clave válida', async () => {
      await restablecerContrasena.restablecer(nuevaContrasena);
      await expect(restablecerContrasena.botonIrAIniciarSesion).toBeVisible();
      await restablecerContrasena.botonIrAIniciarSesion.click();
      await expect(page).toHaveURL(/\/iniciar-sesion$/);
    });

    await test.step('4. Iniciar sesión exitosamente con la nueva contraseña', async () => {
      await iniciarSesion.iniciarSesionCon({
        correo: jugador.correo,
        contrasena: nuevaContrasena,
      });
      await expect(page).toHaveURL(/\/inicio$/);
      await expect(inicioDelJugador.nombreDelJugador).toHaveText(jugador.nombreCompleto);
    });
  });

  test('muestra error si se ingresa a restablecer contraseña con un token inválido', async ({
    restablecerContrasena,
  }) => {
    await restablecerContrasena.abrirConToken('token-falso-o-inexistente-12345');
    await expect(restablecerContrasena.avisoDeError).toBeVisible();
    await expect(restablecerContrasena.avisoDeError).toContainText(/inválido o ha expirado/i);
    await expect(restablecerContrasena.botonSolicitarNuevoEnlace).toBeVisible();
  });

  test('muestra error cuando el correo no está registrado', async ({
    recuperarCuenta,
  }) => {
    const correoInexistente = unJugador().construir().correo;

    await recuperarCuenta.abrir();
    await recuperarCuenta.solicitarRecuperacion(correoInexistente);

    await expect(recuperarCuenta.avisoDeError).toBeVisible();
    await expect(recuperarCuenta.avisoDeError).toContainText(/No se encontró una cuenta/i);
  });
});
