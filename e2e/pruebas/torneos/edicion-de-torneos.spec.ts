import { sufijoEnLetras } from '../../dominio/identificadores';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-21 · Editar torneo', () => {
  test('el administrador puede editar los datos de un torneo en borrador e inscripciones abiertas', async ({
    page,
    escenarios,
    sesion,
    gestionDeTorneos,
  }) => {
    const sufijo = sufijoEnLetras();
    const nombreTorneo = `Copa Bosque Edicion ${sufijo}`;

    const fechaEn15Dias = new Date();
    fechaEn15Dias.setDate(fechaEn15Dias.getDate() + 15);
    const fechaInicioStr = fechaEn15Dias.toISOString().split('T')[0]!;

    const fechaEn25Dias = new Date();
    fechaEn25Dias.setDate(fechaEn25Dias.getDate() + 25);
    const nuevaFechaStr = fechaEn25Dias.toISOString().split('T')[0]!;

    // 1. Iniciar sesión como administrador
    await sesion.iniciarComo(await escenarios.administradorRegistrado());
    await expect(gestionDeTorneos.titulo).toBeVisible();

    // 2. Crear torneo en borrador
    await gestionDeTorneos.abrirModalNuevoTorneo();
    await gestionDeTorneos.diligenciarYGuardarTorneo({
      nombre: nombreTorneo,
      descripcion: 'Descripción inicial',
      fechaInicio: fechaInicioStr,
      cupo: 8,
    });

    const tarjetaTorneo = page
      .locator(`[data-testid^="tarjeta-torneo-"]`)
      .filter({ hasText: nombreTorneo });
    await expect(tarjetaTorneo).toBeVisible();
    await expect(tarjetaTorneo.getByText('Borrador')).toBeVisible();

    // 3. Abrir modal de edición
    await tarjetaTorneo.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('#titulo-modal-editar-torneo')).toBeVisible();

    // 4. Modificar cupo a 12 y nueva fecha
    await page.locator('#cupo-torneo-editar').fill('12');
    await page.locator('#fecha-inicio-torneo-editar').fill(nuevaFechaStr);
    await page.locator('#btn-guardar-editar-torneo').click();

    // 5. Verificar que se actualizó en la tarjeta
    await expect(page.locator('#titulo-modal-editar-torneo')).toBeHidden();
    await expect(tarjetaTorneo.getByText('Cupo: 12 equipos')).toBeVisible();

    // 6. Abrir inscripciones
    await tarjetaTorneo.getByRole('button', { name: 'Abrir inscripciones' }).click();
    await page.locator('#btn-confirmar-apertura-modal').click();
    await expect(tarjetaTorneo.getByText('Inscripciones abiertas')).toBeVisible();

    // 7. Editar en estado inscripciones abiertas
    await tarjetaTorneo.getByRole('button', { name: 'Editar' }).click();
    await expect(page.locator('#titulo-modal-editar-torneo')).toBeVisible();
    await page.locator('#cupo-torneo-editar').fill('16');
    await page.locator('#btn-guardar-editar-torneo').click();

    await expect(page.locator('#titulo-modal-editar-torneo')).toBeHidden();
    await expect(tarjetaTorneo.getByText('Cupo: 16 equipos')).toBeVisible();

    // 8. Cero scroll horizontal en móvil
    await page.setViewportSize({ width: 375, height: 667 });
    const tieneScrollHorizontal = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(tieneScrollHorizontal).toBe(false);
  });
});
