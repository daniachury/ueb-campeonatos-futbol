import { test, expect } from '@playwright/test';

test.describe('Creación de Administrador y Cambio Obligatorio de Contraseña (KAN-18 / KAN-43 / KAN-19)', () => {
  test('Flujo E2E Completo con D1 Real: Registro de nuevo admin, login inicial, bloqueo con modal y cambio de clave', async ({
    page,
    request,
  }) => {
    // 1. Iniciar sesión con el administrador predeterminado del sistema
    const resLoginInicial = await request.post('/api/auth/login', {
      data: {
        correo: 'admin@unbosque.edu.co',
        contrasena: 'admin2026',
      },
    });
    expect(resLoginInicial.status()).toBe(200);

    const storageInicial = await request.storageState();
    await page.context().addCookies(storageInicial.cookies);

    // 2. Navegar al formulario de registro de administrador
    await page.goto('/admin/usuarios/nuevo');
    await expect(page.getByRole('heading', { name: /registrar administrador/i })).toBeVisible();

    const timestamp = Date.now();
    const nuevoCorreoAdmin = `admin.e2e.${timestamp}@unbosque.edu.co`;
    const nuevoNombreAdmin = 'Admin Carlos El Bosque';
    const nuevoTelefonoAdmin = '3129876543';

    // 3. Diligenciar formulario
    await page.getByLabel(/nombre completo/i).fill(nuevoNombreAdmin);
    await page.getByLabel(/correo electrónico/i).fill(nuevoCorreoAdmin);
    await page.getByLabel(/teléfono/i).fill(nuevoTelefonoAdmin);

    // 4. Enviar formulario de creación
    await page.getByRole('button', { name: /registrar administrador/i }).click();

    // 5. Verificar modal de confirmación con contraseña temporal generada por D1
    const modalCreado = page.locator('#modal-admin-creado');
    await expect(modalCreado).toBeVisible();
    await expect(modalCreado.getByText(/¡administrador registrado!/i)).toBeVisible();

    // Obtener la contraseña temporal
    const elementoContrasena = page.locator('#texto-contrasena-temporal');
    await expect(elementoContrasena).toBeVisible();
    const contrasenaTemporal = (await elementoContrasena.textContent())?.trim();
    expect(contrasenaTemporal).toBeTruthy();
    expect(contrasenaTemporal!.length).toBeGreaterThanOrEqual(8);

    // Cerrar modal de confirmación
    await page.getByRole('button', { name: /entendido/i }).click();
    await expect(modalCreado).toHaveCount(0);

    // 6. Cerrar sesión del administrador actual
    await page.context().clearCookies();
    await page.goto('/iniciar-sesion');

    // 7. El NUEVO administrador inicia sesión con la contraseña temporal
    await page.getByLabel('Correo').fill(nuevoCorreoAdmin);
    await page.getByRole('textbox', { name: 'Contraseña' }).fill(contrasenaTemporal!);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    // 8. Fase 1: Siempre debe ir a /admin/torneos
    await expect(page).toHaveURL(/\/admin\/torneos/);
    await expect(page.getByRole('heading', { name: /gestión de torneos/i })).toBeVisible();

    // 9. Fase 1 - 1 y 2: Como tiene debe_cambiar_contrasena: 1, se levanta el modal obligatorio
    const modalCambio = page.getByTestId('modal-cambio-obligatorio-contrasena');
    await expect(modalCambio).toBeVisible();
    await expect(modalCambio.getByRole('heading', { name: /cambia tu contraseña/i })).toBeVisible();

    // 10. Intentar navegar a /admin/sedes mientras el cambio es obligatorio debe redirigir a /admin/torneos sin 403
    let error403Detectado = false;
    page.on('response', (response) => {
      if (response.url().includes('/api/admin/sedes') && response.status() === 403) {
        error403Detectado = true;
      }
    });

    await page.goto('/admin/sedes');
    // Debe redirigir de vuelta a /admin/torneos y mantener el modal activo
    await expect(page).toHaveURL(/\/admin\/torneos/);
    await expect(modalCambio).toBeVisible();
    expect(error403Detectado).toBe(false);

    // 11. Intentar navegar a /torneos también debe llevarlo a /admin/torneos con el modal
    await page.goto('/torneos');
    await expect(page).toHaveURL(/\/admin\/torneos/);
    await expect(modalCambio).toBeVisible();

    // 12. Diligenciar el formulario del modal con la nueva contraseña segura
    const nuevaClaveDefinitiva = 'AdminSeguro2026!';
    await modalCambio.getByLabel(/contraseña actual/i).fill(contrasenaTemporal!);
    await modalCambio.getByLabel(/^nueva contraseña/i).fill(nuevaClaveDefinitiva);
    await modalCambio.getByLabel(/confirmar nueva contraseña/i).fill(nuevaClaveDefinitiva);

    // 13. Enviar actualización de contraseña
    await modalCambio.getByRole('button', { name: /actualizar contraseña/i }).click();

    // 14. El modal se cierra tras la actualización exitosa en D1
    await expect(modalCambio).toHaveCount(0);

    // 15. Ahora el nuevo administrador tiene acceso completo y puede navegar libremente
    await page.goto('/admin/sedes');
    await expect(page).toHaveURL(/\/admin\/sedes/);
    await expect(page.getByTestId('pagina-sedes')).toBeVisible();
    expect(error403Detectado).toBe(false);

    // 16. Puede ingresar a Mi perfil y ver su información actualizada
    await page.goto('/mi-perfil');
    await expect(page).toHaveURL(/\/mi-perfil/);
    await expect(page.locator('#campo-correo')).toHaveValue(nuevoCorreoAdmin);
    await expect(page.locator('#campo-nombre')).toHaveValue('Admin Carlos El Bosque');
  });
});
