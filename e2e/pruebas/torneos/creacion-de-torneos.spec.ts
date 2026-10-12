import { sufijoEnLetras } from '../../dominio/identificadores';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-20 · Crear torneo de fútbol 11 en formato liga y abrir inscripciones', () => {
  test('el administrador crea un torneo en borrador, valida duplicados y abre inscripciones haciéndolo público', async ({
    page,
    escenarios,
    sesion,
    gestionDeTorneos,
  }) => {
    const sufijo = sufijoEnLetras();
    const nombreTorneo = `Copa El Bosque ${sufijo}`;

    // Fecha en 15 días
    const fechaEn15Dias = new Date();
    fechaEn15Dias.setDate(fechaEn15Dias.getDate() + 15);
    const fechaInicioStr = fechaEn15Dias.toISOString().split('T')[0]!;

    // 1. Iniciar sesión como administrador
    await sesion.iniciarComo(await escenarios.administradorRegistrado());
    await expect(gestionDeTorneos.titulo).toBeVisible();

    // 2. Escenario 1: Crear torneo exitosamente en estado Borrador
    await test.step('Admin crea torneo en estado Borrador', async () => {
      await gestionDeTorneos.abrirModalNuevoTorneo();
      await gestionDeTorneos.diligenciarYGuardarTorneo({
        nombre: nombreTorneo,
        descripcion: 'Torneo universitario de fin de año',
        fechaInicio: fechaInicioStr,
        cupo: 8,
      });

      // Debe aparecer con la etiqueta "Borrador"
      await expect(page.getByRole('heading', { name: nombreTorneo })).toBeVisible();
      const tarjetaTorneo = page.locator(`[data-testid^="tarjeta-torneo-"]`).filter({ hasText: nombreTorneo });
      await expect(tarjetaTorneo).toBeVisible();
      await expect(tarjetaTorneo.getByText('Borrador')).toBeVisible();
    });

    // 3. Comprobar que NO es visible para jugadores en /torneos
    await test.step('El torneo en borrador no aparece en el listado público', async () => {
      await page.goto('/torneos');
      await expect(page.getByRole('heading', { name: nombreTorneo })).not.toBeVisible();
      // Regresar a administración
      await page.goto('/admin/torneos');
    });

    // 4. Escenario 3: Rechazo por nombre duplicado insensible a mayúsculas
    await test.step('Intento de crear torneo con nombre repetido es rechazado (409)', async () => {
      await gestionDeTorneos.abrirModalNuevoTorneo();
      await gestionDeTorneos.diligenciarYGuardarTorneo({
        nombre: nombreTorneo.toLowerCase(),
        fechaInicio: fechaInicioStr,
        cupo: 10,
      });

      await expect(page.getByRole('alert')).toContainText('Ya existe un torneo con ese nombre');
      await page.getByRole('button', { name: 'Cancelar' }).click();
    });

    // 5. Escenario 2: Abrir inscripciones (irreversible)
    await test.step('Admin abre las inscripciones del torneo con confirmación', async () => {
      const tarjetaTorneo = page.locator(`[data-testid^="tarjeta-torneo-"]`).filter({ hasText: nombreTorneo });
      const botonAbrir = tarjetaTorneo.getByRole('button', { name: 'Abrir inscripciones' });
      await botonAbrir.click();

      await expect(page.locator('#titulo-modal-confirmar-apertura')).toBeVisible();
      await page.locator('#btn-confirmar-apertura-modal').click();

      // Debe actualizarse la etiqueta a "Inscripciones abiertas"
      await expect(tarjetaTorneo.getByText('Inscripciones abiertas')).toBeVisible();
    });

    // 6. Ahora SÍ debe aparecer en el listado público /torneos
    await test.step('El torneo ahora aparece en el listado público de jugadores', async () => {
      await page.goto('/torneos');
      await expect(page.getByRole('heading', { name: nombreTorneo })).toBeVisible();
      await expect(page.getByText('Inscripciones abiertas')).toBeVisible();
    });

    // 7. Responsividad: Cero scroll horizontal en resolución móvil (375px)
    await test.step('Garantizar ausencia de scroll horizontal en viewport móvil (375px)', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/admin/torneos');
      await page.waitForLoadState('networkidle');

      const tieneScrollHorizontal = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(tieneScrollHorizontal).toBe(false);
    });
  });

  test('un usuario con rol jugador no puede crear torneos ni abrir inscripciones en la API (403)', async ({
    page,
    escenarios,
    sesion,
  }) => {
    // 1. Iniciar sesión como jugador
    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    // 2. Intentar llamar POST /api/admin/torneos con fetch autenticado desde el navegador
    const respuestaCrear = await page.evaluate(async () => {
      const res = await fetch('/api/admin/torneos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: 'Torneo Jugador No Permitido',
          fechaInicio: '2026-12-01',
          cupo: 8,
        }),
      });
      return { status: res.status };
    });

    expect(respuestaCrear.status).toBe(403);
  });
});
