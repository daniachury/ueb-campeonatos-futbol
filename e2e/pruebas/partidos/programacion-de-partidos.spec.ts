import { sufijoEnLetras } from '../../dominio/identificadores';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-35 · Programar partido: lugar, fecha, hora y cancha', () => {
  test('el administrador programa un partido y detecta cruces de horario en la misma cancha', async ({
    page,
    escenarios,
    sesion,
    gestionDeTorneos,
    sedes,
    inscripciones,
  }) => {
    const nombreSede = `Sede Deportiva ${sufijoEnLetras()}`;
    const nombreCancha = `Cancha Principal ${sufijoEnLetras()}`;

    // 1. Preparar torneo con 4 equipos aprobados listos para sortear
    const { torneo } = await escenarios.torneoListoParaSortear(4);
    await sesion.iniciarComo(await escenarios.administradorRegistrado());

    // 2. Registrar sede y cancha deportiva
    await test.step('Dado que existe una sede con una cancha activa', async () => {
      await gestionDeTorneos.irASedesYCanchas();
      await sedes.crearSede({
        nombre: nombreSede,
        direccion: 'Av. Cra 9 # 131A-02',
        ciudad: 'Bogotá',
      });
      await sedes.agregarCancha(nombreSede, {
        nombre: nombreCancha,
        superficie: 'Sintética',
      });
    });

    // 3. Abrir el torneo, sortearlo y pasar al fixture
    await test.step('Y el torneo se encuentra en curso con su fixture generado', async () => {
      await inscripciones.abrirDelTorneo(torneo.id);
      await inscripciones.cerrarInscripcionesYSortear();
      await expect(inscripciones.vistaFixture).toBeVisible();
    });

    // 4. Programar el primer partido
    await test.step('Cuando programa el primer partido con sede, fecha y hora', async () => {
      await inscripciones.primerBotonProgramar.click();
      await expect(inscripciones.modalProgramar).toBeVisible();

      // Programar para sábado a las 14:00
      await inscripciones.programarPartido(nombreCancha, '2026-10-24T14:00');
    });

    // 5. Verificar que el primer partido quedó programado
    await test.step('Entonces el primer partido pasa a estado Programado', async () => {
      await expect(inscripciones.modalProgramar).toBeHidden();
      await expect(inscripciones.vistaFixture).toContainText('Programado');
      await expect(inscripciones.vistaFixture).toContainText(nombreCancha);
      await expect(inscripciones.vistaFixture).toContainText('14:00');
    });

    // 6. Intentar programar el segundo partido a la misma hora en la misma cancha (conflicto)
    await test.step('Cuando intenta programar otro partido en la misma cancha y hora', async () => {
      await inscripciones.segundoBotonProgramar.click();
      await expect(inscripciones.modalProgramar).toBeVisible();

      // Mismo horario de 14:00 (se solapa con la ventana de 120 minutos)
      await inscripciones.programarPartido(nombreCancha, '2026-10-24T14:00');
    });

    // 7. Verificar aviso de cruce de horario
    await test.step('Entonces el sistema muestra advertencia de cruce de horario', async () => {
      await expect(inscripciones.alertaConflicto).toBeVisible();
      await expect(inscripciones.alertaConflicto).toContainText(/Cruce de horario/i);
    });

    // 8. Corregir horario a las 16:30 (horario libre tras finalizar el anterior)
    await test.step('Cuando cambia a un horario libre, se programa exitosamente', async () => {
      await page.getByTestId('input-fecha-hora-partido').fill('2026-10-24T16:30');
      await page.getByRole('button', { name: /Programar partido/ }).click();
      await expect(inscripciones.modalProgramar).toBeHidden();
      await expect(inscripciones.vistaFixture).toContainText('16:30');
    });

    // 9. Verificar responsividad y ausencia de scroll horizontal
    await test.step('Y no presenta scroll horizontal en resolución móvil de 375px', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  });

  test('un jugador no tiene permisos para programar partidos en la API (403)', async ({
    page,
    escenarios,
    sesion,
  }) => {
    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    const respuesta = await page.request.patch('/api/admin/partidos/p-cualquiera/programar', {
      data: {
        canchaId: 'c-1',
        fechaHora: '2026-10-24T14:00:00.000Z',
      },
    });

    expect(respuesta.status()).toBe(403);
  });
});
