import { sufijoEnLetras } from '../../dominio/identificadores';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-27 y KAN-29 · Unirme a un equipo y Salir de un equipo con traspaso de capitanía', () => {
  test('un segundo jugador se une a un equipo disponible y el capitán original puede salir', async ({
    page,
    visitante,
    escenarios,
    sesion,
  }) => {
    const sufijo = sufijoEnLetras();
    const nombreEquipo = `Equipo Fusión ${sufijo}`;

    const capitan = await escenarios.jugadorRegistrado();
    const companero = await escenarios.jugadorRegistrado();

    // 1. El capitán crea el equipo
    await sesion.iniciarComo(capitan);
    await page.goto('/mis-equipos/nuevo');
    await page.locator('input[name="nombre"]').fill(nombreEquipo);
    await page.locator('input[name="color"]').fill('Amarillo');
    await page.getByRole('button', { name: 'Crear equipo' }).click();
    await expect(page).toHaveURL(/\/mis-equipos$/);
    await expect(page.getByRole('heading', { name: nombreEquipo })).toBeVisible();

    // 2. El segundo jugador inicia sesión y se une al equipo
    const sesionCompanero = new (await import('../../flujos/sesion.flujo')).FlujoDeSesion(visitante);
    await sesionCompanero.iniciarComo(companero);

    await visitante.goto('/mis-equipos/unirme');
    await expect(visitante.getByRole('heading', { name: 'Unirme a un equipo' })).toBeVisible();
    const tarjeta = visitante.locator('article').filter({ hasText: nombreEquipo });
    await expect(tarjeta).toBeVisible();

    // Pulsa unirse
    await tarjeta.getByRole('button', { name: 'Unirme' }).click();

    // Va a mis equipos y lo ve en su lista
    await visitante.goto('/mis-equipos');
    await expect(visitante.getByRole('heading', { name: nombreEquipo })).toBeVisible();

    // 3. El capitán original sale del equipo (KAN-29)
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    const tarjetaCapitan = page.locator('article').filter({ hasText: nombreEquipo });
    await tarjetaCapitan.getByRole('button', { name: 'Salir' }).click();

    // Para el capitán, el equipo ya no aparece
    await expect(page.getByRole('heading', { name: nombreEquipo })).toHaveCount(0);

    // 4. Responsividad móvil (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    const tieneScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(tieneScroll).toBe(false);
  });
});
