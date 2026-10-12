import { unJugador } from '../../dominio/fabricas/fabrica-de-usuarios';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-16 · Registro de jugador', () => {
  test('una persona nueva crea su cuenta y entra al inicio del jugador', async ({
    page,
    crearCuenta,
    inicioDelJugador,
    almacen,
  }) => {
    const laura = unJugador().conNombre('Laura Gómez').construir();

    await test.step('Cuando completa el formulario de Crear cuenta', async () => {
      await crearCuenta.abrir();
      await crearCuenta.registrarse(laura);
    });

    await test.step('Entonces entra a su inicio con un mensaje de bienvenida', async () => {
      await expect(page).toHaveURL(/\/inicio$/);
      await expect(inicioDelJugador.nombreDelJugador).toHaveText('Laura Gómez');
      await expect(inicioDelJugador.mensajeDeBienvenida).toContainText('Laura');
    });

    await test.step('Y su contraseña queda guardada con hash, nunca en texto plano', async () => {
      const guardado = await almacen.buscarUsuarioPorCorreo(laura.correo);
      expect(guardado?.rol).toBe('jugador');
      expect(guardado?.hashDeContrasena).toMatch(/^pbkdf2_sha256\$100000\$/);
      expect(guardado?.hashDeContrasena).not.toContain(laura.contrasena);
    });
  });

  test('no permite registrar un correo que ya tiene cuenta', async ({
    page,
    escenarios,
    crearCuenta,
  }) => {
    const existente = await escenarios.jugadorRegistrado();

    await test.step('Cuando alguien intenta registrarse con ese mismo correo', async () => {
      await crearCuenta.abrir();
      await crearCuenta.registrarse(unJugador().conCorreo(existente.correo).construir());
    });

    await test.step('Entonces se queda en el formulario y ve que el correo ya existe', async () => {
      await expect(crearCuenta.campoCorreo).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByText('Este correo ya está registrado')).toBeVisible();
      await expect(page).toHaveURL(/\/crear-cuenta$/);
    });
  });

  test('valida los datos en el formulario antes de enviarlos', async ({ crearCuenta }) => {
    await crearCuenta.abrir();

    await test.step('Cuando escribe una contraseña débil y un correo inválido', async () => {
      await crearCuenta.llenarFormulario(
        unJugador().conCorreo('correo-sin-arroba').conContrasena('corta').construir(),
      );
      await crearCuenta.campoNombreCompleto.focus();
    });

    await test.step('Entonces no puede enviar el formulario', async () => {
      await expect(crearCuenta.campoCorreo).toHaveAttribute('aria-invalid', 'true');
      await expect(crearCuenta.botonCrearCuenta).toBeDisabled();
    });
  });
});
