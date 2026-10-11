import { unJugador } from '../../dominio/fabricas/fabrica-de-usuarios';
import { expect, test } from '../../fixtures/pruebas';

/**
 * Recorrido de punta a punta en un solo video: lo que verá un evaluador para comprobar que
 * todas las historias integradas en main funcionan juntas.
 */
test('recorrido completo: jugador, perfil, administrador, inscripciones y sorteo', async ({
  page,
  escenarios,
  crearCuenta,
  inicioDelJugador,
  miPerfil,
  iniciarSesion,
  gestionDeTorneos,
  registrarAdministrador,
  inscripciones,
  almacen,
}) => {
  test.slow();
  const jugadora = unJugador().conNombre('Valentina Herrera').construir();
  const admin = await escenarios.administradorRegistrado();
  const { torneo, equipos } = await escenarios.torneoConSolicitudesPendientes(3);

  await test.step('KAN-16 · Valentina crea su cuenta de jugadora', async () => {
    await crearCuenta.abrir();
    await crearCuenta.registrarse(jugadora);
    await expect(inicioDelJugador.mensajeDeBienvenida).toBeVisible();
  });

  await test.step('KAN-19 · Actualiza su teléfono en Mi perfil', async () => {
    await inicioDelJugador.irAMiPerfil();
    await miPerfil.actualizarDatos({ telefono: '3157778899' });
    await expect(miPerfil.avisoInformativo.filter({ hasText: 'Datos actualizados' })).toBeVisible();
  });

  await test.step('KAN-17 · Cierra sesión y entra el administrador', async () => {
    await inicioDelJugador.abrir();
    await inicioDelJugador.cerrarSesion();
    await iniciarSesion.iniciarSesionCon(admin);
    await expect(gestionDeTorneos.titulo).toBeVisible();
  });

  await test.step('KAN-18 · El administrador promueve a otra persona a administradora', async () => {
    const coordinadora = await escenarios.jugadorRegistrado();
    await gestionDeTorneos.irARegistrarAdministrador();
    await registrarAdministrador.registrar(coordinadora);
    await registrarAdministrador.promoverAlJugador();
    await expect(registrarAdministrador.dialogoDePromocion).toBeHidden();
  });

  await test.step('KAN-32 · Aprueba las 3 solicitudes del torneo', async () => {
    await inscripciones.abrirDelTorneo(torneo.id);
    for (const equipo of equipos) {
      await inscripciones.aprobar(equipo.nombre);
      await expect(inscripciones.solicitudDe(equipo.nombre)).toBeHidden();
    }
  });

  await test.step('KAN-33 · Cierra inscripciones y genera el fixture', async () => {
    await inscripciones.cerrarInscripcionesYSortear();
    await expect(inscripciones.avisoDeTorneoEnCurso).toBeVisible();
    await expect(inscripciones.pestana('Fixture')).toBeVisible();
    expect(await almacen.cantidadDePartidos(torneo.id)).toBe(3);
  });

  await page.waitForTimeout(1_500); // deja ver el fixture al final del video
});
