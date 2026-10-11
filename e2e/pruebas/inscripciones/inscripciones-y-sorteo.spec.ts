import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-32 · Aprobar y rechazar inscripciones', () => {
  test('el administrador aprueba una solicitud y rechaza otra con motivo', async ({
    escenarios,
    sesion,
    inscripciones,
    almacen,
  }) => {
    const {
      torneo,
      equipos,
      inscripciones: solicitudes,
    } = await escenarios.torneoConSolicitudesPendientes(2);
    const [equipoAprobado, equipoRechazado] = equipos;
    const [solicitudAprobada, solicitudRechazada] = solicitudes;
    await sesion.iniciarComo(await escenarios.administradorRegistrado());

    await test.step('Dado que abre las inscripciones del torneo', async () => {
      await inscripciones.abrirDelTorneo(torneo.id);
      await expect(inscripciones.nombreDelTorneo).toHaveText(torneo.nombre);
    });

    await test.step('Cuando aprueba la primera solicitud', async () => {
      await inscripciones.aprobar(equipoAprobado!.nombre);
      await expect(inscripciones.solicitudDe(equipoAprobado!.nombre)).toBeHidden();
    });

    await test.step('Y rechaza la segunda explicando el motivo', async () => {
      await inscripciones.rechazar(
        equipoRechazado!.nombre,
        'La plantilla no presentó los documentos a tiempo',
      );
      await expect(inscripciones.solicitudDe(equipoRechazado!.nombre)).toBeHidden();
    });

    await test.step('Entonces cada equipo aparece en su pestaña', async () => {
      await inscripciones.verPestana('Aprobados');
      await expect(inscripciones.solicitudDe(equipoAprobado!.nombre)).toBeVisible();
      await inscripciones.verPestana('Rechazados');
      await expect(inscripciones.solicitudDe(equipoRechazado!.nombre)).toContainText(
        'documentos a tiempo',
      );
    });

    await test.step('Y la base de datos refleja las decisiones', async () => {
      expect(await almacen.estadoDeLaInscripcion(solicitudAprobada!.id)).toBe('APROBADO');
      expect(await almacen.estadoDeLaInscripcion(solicitudRechazada!.id)).toBe('RECHAZADO');
    });
  });
});

test.describe('KAN-33 · Cerrar inscripciones y sortear todos contra todos', () => {
  test('con 4 equipos aprobados genera el fixture y el torneo pasa a En curso', async ({
    escenarios,
    sesion,
    inscripciones,
    almacen,
  }) => {
    const { torneo } = await escenarios.torneoListoParaSortear(4);
    await sesion.iniciarComo(await escenarios.administradorRegistrado());

    await test.step('Cuando cierra las inscripciones y confirma el sorteo', async () => {
      await inscripciones.abrirDelTorneo(torneo.id);
      await inscripciones.cerrarInscripcionesYSortear();
    });

    await test.step('Entonces la pantalla muestra el torneo en curso con su fixture', async () => {
      await expect(inscripciones.avisoDeTorneoEnCurso).toBeVisible();
      await expect(inscripciones.pestana('Fixture')).toBeVisible();
    });

    await test.step('Y se crean 6 partidos (4 equipos, todos contra todos)', async () => {
      expect(await almacen.estadoDelTorneo(torneo.id)).toBe('EN_CURSO');
      expect(await almacen.cantidadDePartidos(torneo.id)).toBe(6);
    });
  });

  test('con menos de 3 equipos aprobados no se puede sortear', async ({
    escenarios,
    sesion,
    inscripciones,
  }) => {
    const { torneo } = await escenarios.torneoListoParaSortear(2);
    await sesion.iniciarComo(await escenarios.administradorRegistrado());

    await inscripciones.abrirDelTorneo(torneo.id);

    await expect(inscripciones.botonSortear).toBeDisabled();
  });
});
