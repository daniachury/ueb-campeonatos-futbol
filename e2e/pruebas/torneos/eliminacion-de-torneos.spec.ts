import { sufijoEnLetras } from '../../dominio/identificadores';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-22 · Eliminar torneo', () => {
  test('el administrador ve el impacto, confirma con el nombre exacto y elimina el torneo definitivamente', async ({
    page,
    escenarios,
    sesion,
    gestionDeTorneos,
  }) => {
    const sufijo = sufijoEnLetras();
    const nombreTorneo = `Copa Eliminacion ${sufijo}`;

    const fechaEn15Dias = new Date();
    fechaEn15Dias.setDate(fechaEn15Dias.getDate() + 15);
    const fechaInicioStr = fechaEn15Dias.toISOString().split('T')[0]!;

    // 1. Iniciar sesión como administrador
    await sesion.iniciarComo(await escenarios.administradorRegistrado());
    await expect(gestionDeTorneos.titulo).toBeVisible();

    // 2. Crear torneo en borrador
    await gestionDeTorneos.abrirModalNuevoTorneo();
    await gestionDeTorneos.diligenciarYGuardarTorneo({
      nombre: nombreTorneo,
      descripcion: 'Torneo para prueba de eliminación',
      fechaInicio: fechaInicioStr,
      cupo: 8,
    });

    const tarjetaTorneo = page
      .locator(`[data-testid^="tarjeta-torneo-"]`)
      .filter({ hasText: nombreTorneo });
    await expect(tarjetaTorneo).toBeVisible();

    // 3. Abrir modal de eliminación
    await tarjetaTorneo.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.locator('#titulo-modal-eliminar-torneo')).toBeVisible();

    // 4. Verificar impacto y botón bloqueado
    await expect(page.locator('[data-testid="impacto-eliminacion"]')).toBeVisible();
    const btnConfirmar = page.locator('#btn-confirmar-eliminar-torneo');
    await expect(btnConfirmar).toBeDisabled();

    // 5. Escribir nombre exacto para habilitar confirmación
    await page.locator('#confirmar-nombre-torneo').fill(nombreTorneo);
    await expect(btnConfirmar).toBeEnabled();

    // 6. Confirmar eliminación
    await btnConfirmar.click();

    // 7. Verificar que el modal se cierra y el torneo ya no aparece
    await expect(page.locator('#titulo-modal-eliminar-torneo')).toBeHidden();
    await expect(
      page.locator(`[data-testid^="tarjeta-torneo-"]`).filter({ hasText: nombreTorneo }),
    ).toHaveCount(0);

    // 8. Cero scroll horizontal en móvil
    await page.setViewportSize({ width: 375, height: 667 });
    const tieneScrollHorizontal = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(tieneScrollHorizontal).toBe(false);
  });

  test('un usuario con rol jugador no puede eliminar torneos en la API (403)', async ({
    page,
    escenarios,
    sesion,
  }) => {
    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    const respuestaEliminar = await page.evaluate(async () => {
      const res = await fetch('/api/admin/torneos/torneo-cualquiera', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmacionNombre: 'Torneo Cualquiera' }),
      });
      return { status: res.status };
    });

    expect(respuestaEliminar.status).toBe(403);
  });
});
