import { sufijoEnLetras } from '../../dominio/identificadores';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-34 · Sedes y canchas', () => {
  test('el administrador registra una sede y le agrega una cancha', async ({
    escenarios,
    sesion,
    gestionDeTorneos,
    sedes,
  }) => {
    const nombreDeLaSede = `Complejo El Bosque ${sufijoEnLetras()}`;
    const nombreDeLaCancha = `Cancha ${sufijoEnLetras()}`;
    await sesion.iniciarComo(await escenarios.administradorRegistrado());

    await test.step('Cuando crea una sede desde Gestión de torneos', async () => {
      await gestionDeTorneos.irASedesYCanchas();
      await expect(sedes.contenido).toBeVisible();
      await sedes.crearSede({
        nombre: nombreDeLaSede,
        direccion: 'Av. Cra 9 # 131A-02',
        ciudad: 'Bogotá',
        indicaciones: 'Portería norte vehicular',
      });
    });

    await test.step('Entonces la sede aparece con su dirección y sin canchas', async () => {
      const tarjeta = sedes.tarjetaDe(nombreDeLaSede);
      await expect(tarjeta).toContainText('Av. Cra 9 # 131A-02');
      await expect(tarjeta).toContainText('0 canchas');
    });

    await test.step('Cuando le agrega una cancha sintética', async () => {
      await sedes.agregarCancha(nombreDeLaSede, {
        nombre: nombreDeLaCancha,
        superficie: 'Sintética',
      });
    });

    await test.step('Entonces la cancha queda asociada a la sede', async () => {
      const tarjeta = sedes.tarjetaDe(nombreDeLaSede);
      await expect(tarjeta).toContainText(nombreDeLaCancha);
      await expect(tarjeta).toContainText('Sintética');
      await expect(tarjeta).toContainText('1 canchas');
    });
  });

  test('un jugador que abre /admin/sedes ve un acceso no autorizado y puede volver', async ({
    page,
    escenarios,
    sesion,
    sedes,
  }) => {
    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    await sedes.abrir();

    await expect(sedes.estadoSinPermiso).toContainText('Acceso no autorizado (403)');
    await expect(sedes.botonNuevaSede).toHaveCount(0);
    await sedes.volverAlInicio();
    await expect(page).toHaveURL(/\/inicio$/);
  });

  test('las pantallas del administrador no tienen scroll horizontal en móvil, tablet y escritorio', async ({
    page,
    escenarios,
    sesion,
    gestionDeTorneos,
    sedes,
  }) => {
    const anchos = [320, 375, 410, 768, 1024];
    const hayScrollHorizontal = () =>
      page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    await sesion.iniciarComo(await escenarios.administradorRegistrado());

    for (const ancho of anchos) {
      await test.step(`A ${ancho}px de ancho`, async () => {
        await page.setViewportSize({ width: ancho, height: 800 });
        await gestionDeTorneos.abrir();
        await expect(gestionDeTorneos.enlaceSedesYCanchas).toBeVisible();
        await expect(gestionDeTorneos.botonCerrarSesion).toBeVisible();
        expect(await hayScrollHorizontal()).toBe(false);

        await gestionDeTorneos.irASedesYCanchas();
        await expect(sedes.contenido).toBeVisible();
        expect(await hayScrollHorizontal()).toBe(false);
      });
    }
  });

  test('el administrador cierra sesión desde su encabezado', async ({
    page,
    escenarios,
    sesion,
    gestionDeTorneos,
  }) => {
    await sesion.iniciarComo(await escenarios.administradorRegistrado());

    await gestionDeTorneos.cerrarSesion();

    await expect(page).toHaveURL(/\/iniciar-sesion$/);
  });
});
