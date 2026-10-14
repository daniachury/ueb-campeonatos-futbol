import { unJugador } from '../../dominio/fabricas/fabrica-de-usuarios';
import { expect, test } from '../../fixtures/pruebas';

/**
 * Recorrido de punta a punta en un solo video: lo que verá un evaluador para comprobar que
 * todas las historias integradas en main funcionan juntas.
 */
test('recorrido completo: jugador, capitán y administrador con inscripciones y sorteo', async ({
  page,
  escenarios,
  crearCuenta,
  inicioDelJugador,
  miPerfil,
  iniciarSesion,
  gestionDeTorneos,
  registrarAdministrador,
  inscripciones,
  sedes,
  almacen,
}) => {
  test.slow();

  // 1. Datos iniciales del escenario
  const jugadora = unJugador().conNombre('Valentina Herrera').construir();
  const capitan = await escenarios.jugadorRegistrado(
    unJugador().conNombre('Carlos El Capitán').construir(),
  );
  const admin = await escenarios.administradorRegistrado();
  const { torneo, equipos } = await escenarios.torneoConSolicitudesPendientes(2);

  // Equipo completo del capitán para que cumpla el mínimo de 11 jugadores
  const equipoCapitan = await escenarios.equipoConPlantillaCompleta(
    'Halcones El Bosque',
    capitan,
  );

  // ==========================================
  // ROL 1: JUGADOR
  // ==========================================
  await test.step('ROL JUGADOR · Valentina crea su cuenta y explora la plataforma', async () => {
    await crearCuenta.abrir();
    await crearCuenta.registrarse(jugadora);
    await expect(inicioDelJugador.mensajeDeBienvenida).toBeVisible();
  });

  await test.step('ROL JUGADOR · Actualiza sus datos de contacto en Mi Perfil', async () => {
    await inicioDelJugador.irAMiPerfil();
    await miPerfil.actualizarDatos({ telefono: '3157778899' });
    await expect(miPerfil.avisoInformativo.filter({ hasText: 'Datos actualizados' })).toBeVisible();
  });

  await test.step('ROL JUGADOR · Consulta torneos públicos y equipos disponibles', async () => {
    await page.goto('/torneos');
    await expect(page.getByRole('heading', { name: 'Torneos' })).toBeVisible();
    await page.goto('/mis-equipos/unirme');
    await expect(page.getByRole('heading', { name: 'Unirme a un equipo' })).toBeVisible();
  });

  await test.step('ROL JUGADOR · Cierra sesión', async () => {
    await inicioDelJugador.abrir();
    await inicioDelJugador.cerrarSesion();
    await expect(page).toHaveURL(/\/iniciar-sesion/);
  });

  // ==========================================
  // ROL 2: CAPITÁN
  // ==========================================
  await test.step('ROL CAPITÁN · Carlos inicia sesión y gestiona su equipo', async () => {
    await iniciarSesion.iniciarSesionCon(capitan);
    await page.goto('/mis-equipos');
    await expect(page.getByRole('heading', { name: 'Mis equipos' })).toBeVisible();
    await expect(page.getByRole('heading', { name: equipoCapitan.nombre })).toBeVisible();
    await expect(page.getByText('Capitán · Carlos El Capitán')).toBeVisible();
  });

  await test.step('ROL CAPITÁN · Inscribe su equipo en el torneo abierto', async () => {
    await page.goto(`/torneos/${torneo.id}`);
    await expect(page.getByRole('heading', { name: torneo.nombre })).toBeVisible();
    await page.locator('select').selectOption({ label: equipoCapitan.nombre });
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(page.getByText('Solicitud enviada.')).toBeVisible();
  });

  await test.step('ROL CAPITÁN · Cierra sesión', async () => {
    await inicioDelJugador.abrir();
    await inicioDelJugador.cerrarSesion();
    await expect(page).toHaveURL(/\/iniciar-sesion/);
  });

  // ==========================================
  // ROL 3: ADMINISTRADOR
  // ==========================================
  await test.step('ROL ADMINISTRADOR · Inicia sesión y llega directamente al Panel de administración (/admin)', async () => {
    await iniciarSesion.iniciarSesionCon(admin);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
    await expect(page.getByText('Torneos creados')).toBeVisible();
    await expect(page.getByText('Equipos registrados')).toBeVisible();
    await expect(page.getByText('Partidos generados')).toBeVisible();
    await expect(page.getByText('Jugadores activos')).toBeVisible();
    await expect(page.getByText('Solicitudes pendientes')).toBeVisible();
    await page.waitForTimeout(1_500);
    await gestionDeTorneos.abrir();
    await expect(gestionDeTorneos.titulo).toBeVisible();
  });

  await test.step('ROL ADMINISTRADOR · Promueve a una asistente como administradora', async () => {
    const coordinadora = await escenarios.jugadorRegistrado();
    await gestionDeTorneos.irARegistrarAdministrador();
    await registrarAdministrador.registrar(coordinadora);
    await registrarAdministrador.promoverAlJugador();
    await expect(registrarAdministrador.dialogoDePromocion).toBeHidden();
  });

  await test.step('ROL ADMINISTRADOR · Revisa solicitudes y aprueba los equipos del torneo', async () => {
    await inscripciones.abrirDelTorneo(torneo.id);
    // Aprueba el equipo del capitán
    await inscripciones.aprobar(equipoCapitan.nombre);
    await expect(inscripciones.solicitudDe(equipoCapitan.nombre)).toBeHidden();
    // Aprueba los demás equipos para cumplir con el cupo mínimo
    for (const equipo of equipos) {
      await inscripciones.aprobar(equipo.nombre);
      await expect(inscripciones.solicitudDe(equipo.nombre)).toBeHidden();
    }
  });

  await test.step('ROL ADMINISTRADOR · Cierra inscripciones y sortea el fixture', async () => {
    await inscripciones.cerrarInscripcionesYSortear();
    await expect(inscripciones.avisoDeTorneoEnCurso).toBeVisible();
    await expect(inscripciones.pestana('Fixture')).toBeVisible();
    expect(await almacen.cantidadDePartidos(torneo.id)).toBeGreaterThanOrEqual(3);
  });

  await test.step('ROL ADMINISTRADOR · Consulta sedes e infraestructura deportiva', async () => {
    await sedes.abrir();
    await expect(sedes.contenido).toBeVisible();
  });

  // Pausa visual para que el evaluador pueda apreciar la vista final en la grabación
  await page.waitForTimeout(3_000);
});
