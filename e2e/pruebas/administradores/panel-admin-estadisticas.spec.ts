import { unAdministrador, unJugador } from '../../dominio/fabricas/fabrica-de-usuarios';
import { expect, test } from '../../fixtures/pruebas';

test.describe('KAN-48 · Estadísticas administrativas en tiempo real (/admin)', () => {
  test('el administrador visualiza las métricas conectadas a la base de datos real', async ({
    page,
    escenarios,
    sesion,
  }) => {
    const admin = await escenarios.administradorRegistrado(
      unAdministrador().conNombre('Laura Administradora').construir(),
    );

    await test.step('Cuando el administrador inicia sesión y entra al panel', async () => {
      await sesion.iniciarComo(admin);
      await page.goto('/admin');
    });

    await test.step('Entonces ve el encabezado del panel y su bienvenida', async () => {
      await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible();
      await expect(page.getByText(/Hola, Laura Administradora/i)).toBeVisible();
    });

    await test.step('Y las métricas reflejan los datos dinámicos de la base de datos', async () => {
      await expect(page.getByText('Torneos creados')).toBeVisible();
      await expect(page.getByText('Equipos registrados')).toBeVisible();
      await expect(page.getByText('Partidos generados')).toBeVisible();
      await expect(page.getByText('Jugadores activos')).toBeVisible();
      await expect(page.getByText('Solicitudes pendientes')).toBeVisible();

      // Verifica que no aparezca el aviso de error de conexión
      await expect(
        page.getByText(/No se pudieron cargar las estadísticas en tiempo real/i),
      ).toBeHidden();
    });

    await test.step('Y los accesos rápidos a módulos administrativos están disponibles', async () => {
      await expect(page.getByRole('link', { name: /Gestionar torneos/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Gestionar jugadores/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Gestionar equipos/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Gestionar inscripciones/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Programar partidos/i })).toBeVisible();
    });
  });

  test('un usuario con rol jugador es redirigido fuera de /admin', async ({
    page,
    escenarios,
    sesion,
  }) => {
    const jugador = await escenarios.jugadorRegistrado(
      unJugador().conNombre('Esteban Jugador').construir(),
    );

    await sesion.iniciarComo(jugador);
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/(inicio)?$/);
    await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeHidden();
  });
});
