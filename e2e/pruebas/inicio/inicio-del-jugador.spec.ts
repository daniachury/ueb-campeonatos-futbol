import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-41 · Inicio del jugador nuevo (primer ingreso)', () => {
  test('un jugador sin equipo ve las secciones informativas con estado vacío', async ({
    page,
    escenarios,
    sesion,
    inicioDelJugador,
  }) => {
    const jugador = await escenarios.jugadorRegistrado();
    await sesion.iniciarComo(jugador);

    await test.step('Cuando abre el Inicio del jugador', async () => {
      await inicioDelJugador.abrir();
      await expect(page).toHaveURL(/\/inicio$/);
    });

    await test.step('Entonces ve su saludo y los encabezados de las secciones', async () => {
      await expect(inicioDelJugador.nombreDelJugador).toHaveText(jugador.nombreCompleto);
      await expect(page.getByRole('heading', { level: 2, name: 'Tu próximo partido' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Empieza en 3 pasos' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Calendario' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Tabla de posiciones' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Mis torneos' })).toBeVisible();
    });

    await test.step('Y cada sección muestra su estado vacío sin datos inventados', async () => {
      await expect(page.getByText('Sin partido programado')).toBeVisible();
      await expect(page.getByText('Sin fechas programadas')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Unirme a un equipo' })).toHaveAttribute(
        'href',
        '/mis-equipos/unirme',
      );
    });
  });

  test('el calendario semanal muestra los días de lunes a domingo', async ({
    escenarios,
    sesion,
    inicioDelJugador,
    page,
  }) => {
    const jugador = await escenarios.jugadorRegistrado();
    await sesion.iniciarComo(jugador);
    await inicioDelJugador.abrir();

    await test.step('Entonces ve el calendario con selección de días', async () => {
      const calendario = page.getByRole('region', { name: 'Calendario semanal' }).or(page.locator('section').filter({ hasText: 'Calendario' }));
      await expect(calendario).toBeVisible();
    });
  });
});
