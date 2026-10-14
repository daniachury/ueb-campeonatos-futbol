import { sufijoEnLetras } from '../../dominio/identificadores';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-23 · Ver todos los torneos y su detalle', () => {
  test('un visitante o jugador puede ver el listado de torneos y acceder al detalle del torneo', async ({
    page,
    escenarios,
    sesion,
    gestionDeTorneos,
    torneosPublicosDelVisitante,
    visitante,
  }) => {
    const sufijo = sufijoEnLetras();
    const nombreTorneo = `Torneo Intercarreras ${sufijo}`;
    const fechaInicio = new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0]!;

    // 1. Crear y abrir inscripciones como admin para tener un torneo disponible
    await sesion.iniciarComo(await escenarios.administradorRegistrado());
    await gestionDeTorneos.abrirModalNuevoTorneo();
    await gestionDeTorneos.diligenciarYGuardarTorneo({
      nombre: nombreTorneo,
      descripcion: 'Detalle e información del torneo intercarreras',
      fechaInicio,
      cupo: 8,
    });

    const tarjetaTorneoAdmin = page
      .locator(`[data-testid^="tarjeta-torneo-"]`)
      .filter({ hasText: nombreTorneo });
    await tarjetaTorneoAdmin.getByRole('button', { name: 'Abrir inscripciones' }).click();
    await page.locator('#btn-confirmar-apertura-modal').click();
    await expect(tarjetaTorneoAdmin.getByText('Inscripciones abiertas')).toBeVisible();

    // 2. Acceder al listado público desde la ventana del visitante
    await torneosPublicosDelVisitante.abrirYEsperarListado();
    const tarjeta = torneosPublicosDelVisitante.tarjetaDe(nombreTorneo);
    await expect(tarjeta).toBeVisible();
    await expect(tarjeta.getByText('Inscripciones abiertas')).toBeVisible();

    // 3. Hacer clic en "Ver detalle"
    await tarjeta.getByRole('link', { name: /Ver detalle/i }).click();

    // 4. Verificar pantalla de detalle del torneo (KAN-23)
    await expect(visitante).toHaveURL(/\/torneos\/[a-zA-Z0-9_-]+$/);
    await expect(visitante.getByRole('heading', { name: nombreTorneo })).toBeVisible();
    await expect(visitante.getByText('8 equipos')).toBeVisible();
    await expect(visitante.getByText('Inscripciones abiertas')).toBeVisible();
    await expect(visitante.getByText('Liga, una vuelta')).toBeVisible();

    // 5. Cero scroll horizontal en resolución móvil
    await visitante.setViewportSize({ width: 375, height: 667 });
    const tieneScrollHorizontal = await visitante.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(tieneScrollHorizontal).toBe(false);
  });
});
