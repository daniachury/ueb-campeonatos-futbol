import { test, expect } from '@playwright/test';

test.describe('Edición de mis datos y perfil (KAN-19 E2E con D1 Real)', () => {
  test('Flujo Administrador: Administrador navega a Mi perfil, ve layout de admin y actualiza sus datos en D1', async ({
    page,
    request,
  }) => {
    // 1. Iniciar sesión con rol administrador
    const resLogin = await request.post('/api/auth/login', {
      data: {
        correo: 'admin@unbosque.edu.co',
        contrasena: 'admin2026',
      },
    });
    expect(resLogin.status()).toBe(200);

    const storageState = await request.storageState();
    await page.context().addCookies(storageState.cookies);

    // 2. Administrador entra a /admin/torneos
    await page.goto('/admin/torneos');
    await expect(page.getByRole('heading', { name: /gestión de torneos/i })).toBeVisible();

    // 3. Verifica y pulsa el botón "Mi perfil" en el encabezado administrativo
    const botonPerfil = page.getByRole('link', { name: /mi perfil/i });
    await expect(botonPerfil).toBeVisible();
    await botonPerfil.click();

    // 4. Se carga /mi-perfil en el marco de administrador
    await expect(page).toHaveURL(/\/mi-perfil/);
    await expect(page.getByTestId('pantalla-perfil-admin')).toBeVisible();
    await expect(page.getByTestId('encabezado-admin')).toBeVisible();

    // 5. Verifica insignia de Administrador y enlace de retorno
    const enlaceVolver = page.getByRole('link', { name: /volver a gestión de torneos/i });
    await expect(enlaceVolver).toBeVisible();
    await expect(page.getByText('Administrador').first()).toBeVisible();

    // 6. Escenario 5: El botón Guardar está deshabilitado mientras no haya cambios
    const botonGuardar = page.getByRole('button', { name: /guardar/i });
    await expect(botonGuardar).toBeDisabled();

    // 7. Modificar teléfono
    const nuevoTelefono = `300${Date.now().toString().slice(-7)}`;
    const campoTelefono = page.getByLabel(/teléfono/i);
    await campoTelefono.fill(nuevoTelefono);

    // 8. Botón Guardar se habilita y se envía la actualización
    await expect(botonGuardar).toBeEnabled();
    await botonGuardar.click();

    // 9. Se muestra confirmación "Datos actualizados"
    await expect(page.getByText(/datos actualizados/i)).toBeVisible();

    // 10. Retornar a gestión de torneos
    await enlaceVolver.click();
    await expect(page).toHaveURL(/\/admin\/torneos/);
  });

  test('Flujo Jugador: Jugador navega a Mi perfil dentro del marco del jugador y visualiza sus datos', async ({
    page,
    request,
  }) => {
    // 1. Iniciar sesión con rol jugador
    const resLogin = await request.post('/api/auth/login', {
      data: {
        correo: 'jugador1@unbosque.edu.co',
        contrasena: 'jugador2026',
      },
    });
    expect(resLogin.status()).toBe(200);

    const storageState = await request.storageState();
    await page.context().addCookies(storageState.cookies);

    // 2. Jugador navega a /inicio y luego a /mi-perfil
    await page.goto('/mi-perfil');

    // 3. Verifica insignia de Jugador
    await expect(page.getByText('Jugador').first()).toBeVisible();

    // 4. Modificar teléfono
    const nuevoTelefono = `310${Date.now().toString().slice(-7)}`;
    const campoTelefono = page.getByLabel(/teléfono/i);
    await campoTelefono.fill(nuevoTelefono);

    // 5. Guardar datos
    const botonGuardar = page.getByRole('button', { name: /guardar/i });
    await expect(botonGuardar).toBeEnabled();
    await botonGuardar.click();

    // 6. Verifica confirmación
    await expect(page.getByText(/datos actualizados/i)).toBeVisible();
  });

  test('Responsive UI: Encabezado del administrador y Mi perfil sin scroll horizontal en 320px, 375px y 410px', async ({
    page,
    request,
  }) => {
    // 1. Iniciar sesión con rol administrador
    const resLogin = await request.post('/api/auth/login', {
      data: {
        correo: 'admin@unbosque.edu.co',
        contrasena: 'admin2026',
      },
    });
    expect(resLogin.status()).toBe(200);

    const storageState = await request.storageState();
    await page.context().addCookies(storageState.cookies);

    const viewports = [
      { width: 320, height: 568, name: '320px' },
      { width: 375, height: 667, name: '375px' },
      { width: 410, height: 800, name: '410px' },
      { width: 768, height: 1024, name: '768px' },
      { width: 1024, height: 768, name: '1024px' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Verificar /admin/torneos
      await page.goto('/admin/torneos');
      await expect(page.getByTestId('encabezado-admin')).toBeVisible();

      const scrollTorneos = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(scrollTorneos).toBe(true);

      // Verificar /mi-perfil
      await page.goto('/mi-perfil');
      await expect(page.getByTestId('pantalla-perfil-admin')).toBeVisible();

      const scrollPerfil = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(scrollPerfil).toBe(true);
    }
  });
});
