import { sufijoEnLetras } from '../../dominio/identificadores';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-24 · Crear equipo (el creador queda como capitán)', () => {
  test('un jugador crea su equipo exitosamente y queda como capitán', async ({
    page,
    escenarios,
    sesion,
  }) => {
    const sufijo = sufijoEnLetras();
    const nombreEquipo = `Halcones ${sufijo}`;

    // 1. Iniciar sesión como jugador
    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    // 2. Ir a la pantalla de crear equipo (/mis-equipos/nuevo)
    await page.goto('/mis-equipos/nuevo');
    await expect(page.getByRole('heading', { name: 'Crear equipo' })).toBeVisible();

    // 3. Diligenciar formulario
    await page.locator('input[name="nombre"]').fill(nombreEquipo);
    await page.locator('input[name="color"]').fill('Azul y Blanco');
    await page.getByRole('button', { name: 'Crear equipo' }).click();

    // 4. Redirige a mis equipos y muestra el equipo creado
    await expect(page).toHaveURL(/\/mis-equipos$/);
    await expect(page.getByRole('heading', { name: nombreEquipo })).toBeVisible();

    // 5. Intento de crear equipo con nombre repetido es rechazado (409)
    await page.goto('/mis-equipos/nuevo');
    await page.locator('input[name="nombre"]').fill(nombreEquipo.toLowerCase());
    await page.locator('input[name="color"]').fill('Rojo');
    await page.getByRole('button', { name: 'Crear equipo' }).click();

    await expect(page.getByRole('alert')).toContainText('Ya existe un equipo con ese nombre');

    // 6. Cero scroll horizontal en móvil
    await page.setViewportSize({ width: 375, height: 667 });
    const tieneScrollHorizontal = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(tieneScrollHorizontal).toBe(false);
  });
});
