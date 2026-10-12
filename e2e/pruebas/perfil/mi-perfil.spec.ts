import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-19 · Mi perfil', () => {
  test('el jugador actualiza su nombre y teléfono, y los cambios se mantienen', async ({
    page,
    escenarios,
    sesion,
    inicioDelJugador,
    miPerfil,
  }) => {
    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    await test.step('Cuando edita sus datos personales', async () => {
      await inicioDelJugador.irAMiPerfil();
      await miPerfil.actualizarDatos({ nombreCompleto: 'Camila Rojas', telefono: '3209998877' });
    });

    await test.step('Entonces ve la confirmación', async () => {
      await expect(
        miPerfil.avisoInformativo.filter({ hasText: 'Datos actualizados' }),
      ).toBeVisible();
    });

    await test.step('Y al recargar la página los datos siguen ahí', async () => {
      await page.reload();
      await expect(miPerfil.campoNombreCompleto).toHaveValue('Camila Rojas');
      await expect(miPerfil.campoTelefono).toHaveValue('3209998877');
    });
  });

  test('al cambiar la contraseña solo sirve la nueva', async ({
    escenarios,
    sesion,
    miPerfil,
    inicioDelJugador,
    iniciarSesion,
    page,
  }) => {
    const jugador = await escenarios.jugadorRegistrado();
    const nuevaContrasena = 'Remate2027';
    await sesion.iniciarComo(jugador);

    await test.step('Cuando cambia su contraseña desde Mi perfil', async () => {
      await miPerfil.abrir();
      await miPerfil.cambiarContrasena(jugador.contrasena, nuevaContrasena);
      await expect(
        miPerfil.avisoInformativo.filter({ hasText: 'Contraseña actualizada' }),
      ).toBeVisible();
    });

    await test.step('Entonces la contraseña anterior ya no le permite entrar', async () => {
      await inicioDelJugador.abrir();
      await inicioDelJugador.cerrarSesion();
      await iniciarSesion.iniciarSesionCon(jugador);
      await expect(iniciarSesion.avisoDeError).toContainText('Correo o contraseña incorrectos');
    });

    await test.step('Y la nueva sí', async () => {
      await iniciarSesion.iniciarSesionCon({ correo: jugador.correo, contrasena: nuevaContrasena });
      await expect(page).toHaveURL(/\/inicio$/);
    });
  });
});
