import { sufijoEnLetras } from '../../dominio/identificadores';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-25, KAN-26 y KAN-30 · Administración de equipos y jugadores', () => {
  test('administrador consulta, gestiona integrantes y elimina equipos', async ({
    page,
    visitante,
    escenarios,
    sesion,
  }) => {
    const sufijo = sufijoEnLetras();
    const nombreEquipo = `Equipo Admin ${sufijo}`;

    const admin = await escenarios.administradorRegistrado();
    const jugadorCapitan = await escenarios.jugadorRegistrado();
    const jugadorIntegrante = await escenarios.jugadorRegistrado();

    // 1. Capitán crea el equipo
    await sesion.iniciarComo(jugadorCapitan);
    await page.goto('/mis-equipos/nuevo');
    await page.locator('input[name="nombre"]').fill(nombreEquipo);
    await page.locator('input[name="color"]').fill('Azul Marino');
    await page.getByRole('button', { name: 'Crear equipo' }).click();
    await expect(page).toHaveURL(/\/mis-equipos$/);

    // 2. Segundo jugador se une al equipo
    const sesionCompanero = new (await import('../../flujos/sesion.flujo')).FlujoDeSesion(visitante);
    await sesionCompanero.iniciarComo(jugadorIntegrante);
    await visitante.goto('/mis-equipos/unirme');
    const tarjetaCompanero = visitante.locator('article').filter({ hasText: nombreEquipo });
    await tarjetaCompanero.getByRole('button', { name: 'Unirme' }).click();

    // 3. Administrador inicia sesión y ve el equipo en /admin/equipos
    await sesion.iniciarComo(admin);
    await page.goto('/admin/equipos');
    await expect(page.getByRole('heading', { name: 'Gestionar equipos' })).toBeVisible();
    const tarjetaAdmin = page.locator('article').filter({ hasText: nombreEquipo });
    await expect(tarjetaAdmin).toBeVisible();

    // 4. Administrador elimina el equipo (KAN-26)
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await tarjetaAdmin.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.locator('article').filter({ hasText: nombreEquipo })).toHaveCount(0);

    // 5. Cero scroll horizontal en móvil
    await page.setViewportSize({ width: 375, height: 667 });
    const tieneScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(tieneScroll).toBe(false);
  });

  test('un jugador no tiene acceso a endpoints de administración de equipos (403)', async ({
    page,
    escenarios,
    sesion,
  }) => {
    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    const respuestaEliminar = await page.evaluate(async () => {
      const res = await fetch('/api/admin/equipos/equipo-random', {
        method: 'DELETE',
      });
      return { status: res.status };
    });

    expect(respuestaEliminar.status).toBe(403);
  });
});
