import { test, expect } from '@playwright/test';

test.describe('Gestión de Sedes y Canchas (KAN-34 E2E con D1 Real)', () => {
  test('Ajustes 1 y 2: Un jugador que accede directamente a /admin/sedes ve estado 403 y no ve el botón "+ Nueva sede"', async ({
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

    // 2. Jugador navega directamente a la URL protegida /admin/sedes
    await page.goto('/admin/sedes');

    // 3. Ajuste 2: Se muestra un estado 403 claro y amigable
    const tarjeta403 = page.getByTestId('estado-403');
    await expect(tarjeta403).toBeVisible();

    const titulo403 = page.getByRole('heading', { name: /acceso no autorizado \(403\)/i });
    await expect(titulo403).toBeVisible();

    await expect(
      page.getByText(/no tienes permisos de administrador para gestionar sedes y canchas/i),
    ).toBeVisible();

    // 4. Ajuste 1: El botón "+ Nueva sede" NO existe para el jugador
    await expect(page.getByRole('button', { name: /\+ nueva sede/i })).toHaveCount(0);

    // 5. Botón "Volver al inicio" funciona y navega al home del jugador
    const botonVolver = page.getByRole('link', { name: /volver al inicio/i });
    await expect(botonVolver).toBeVisible();
    await botonVolver.click();

    await expect(page).toHaveURL(/\/inicio/);
  });

  test('Flujo E2E Completo: Administrador registra sede y cancha en la base de datos real D1', async ({
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

    // 2. Administrador entra a /admin/sedes
    await page.goto('/admin/sedes');
    await expect(page.getByTestId('pagina-sedes')).toBeVisible();

    // 3. El botón "+ Nueva sede" está disponible
    const botonNuevaSede = page.getByRole('button', { name: /\+ nueva sede/i });
    await expect(botonNuevaSede).toBeVisible();
    await botonNuevaSede.click();

    // 4. Llenar y enviar formulario de Sede
    const timestamp = Date.now();
    const nombreSede = `Complejo El Bosque E2E ${timestamp}`;
    await page.getByLabel(/nombre de la sede/i).fill(nombreSede);
    await page.getByLabel(/dirección/i).fill('Av. Cra 9 # 131A-02');
    await page.getByLabel(/ciudad/i).fill('Bogotá');
    await page.getByLabel(/indicaciones/i).fill('Portería norte vehicular');

    await page.getByRole('button', { name: /guardar sede/i }).click();

    // 5. Verificar que la sede aparece en la base de datos real y en el DOM
    const tarjeta = page.locator('article', { hasText: nombreSede });
    await expect(tarjeta).toBeVisible();
    await expect(tarjeta.getByRole('heading', { name: nombreSede })).toBeVisible();
    await expect(tarjeta.getByText('📍 Av. Cra 9 # 131A-02')).toBeVisible();
    await expect(tarjeta.getByText('⚽ 0 canchas')).toBeVisible();

    // 6. Localizar el botón de la tarjeta recién creada y agregar cancha
    await tarjeta.getByRole('button', { name: /\+ agregar cancha/i }).click();

    // 7. Llenar y enviar formulario de Cancha (máximo 30 caracteres)
    const nombreCancha = `Cancha Sint ${timestamp.toString().slice(-4)}`;
    await page.getByLabel(/nombre o número de cancha/i).fill(nombreCancha);
    await page.getByLabel(/superficie/i).selectOption('Sintética');

    await page.getByRole('button', { name: /guardar cancha/i }).click();

    // 8. Verificar que la cancha se renderizó asociada a la sede
    await expect(tarjeta.getByText(nombreCancha)).toBeVisible();
    await expect(tarjeta.getByText('Sintética')).toBeVisible();
    await expect(tarjeta.getByText('⚽ 1 canchas')).toBeVisible();
  });

  test('Responsive UI: Encabezado del admin y modal de canchas sin scroll horizontal en 320px, 375px y 410px', async ({
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
      { width: 320, height: 568, name: 'iPhone 5 / 320px' },
      { width: 375, height: 667, name: 'iPhone SE / 375px' },
      { width: 410, height: 800, name: 'Móvil estándar / 410px' },
      { width: 768, height: 1024, name: 'Tablet / 768px' },
      { width: 1024, height: 768, name: 'Desktop / 1024px' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Verificar /admin/torneos
      await page.goto('/admin/torneos');
      await expect(page.getByRole('heading', { name: /gestión de torneos/i })).toBeVisible();

      // Verificar que no hay scroll horizontal en /admin/torneos
      const scrollTorneos = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(scrollTorneos).toBe(true);

      if (vp.width < 768) {
        // En móvil (< 768px), navegación mediante menú hamburguesa Neón (v3 · M12 / KAN-43)
        const botonMenu = page.getByRole('button', { name: /abrir menú/i });
        await expect(botonMenu).toBeVisible();
        await botonMenu.click();

        const menuMovil = page.getByTestId('menu-movil-admin');
        await expect(menuMovil).toBeVisible();
        const botonSedesMovil = menuMovil.getByRole('link', { name: /sedes y canchas/i });
        await expect(botonSedesMovil).toBeVisible();
        await botonSedesMovil.click();
      } else {
        // En escritorio (>= 768px), botones visibles en barra horizontal
        const botonSedes = page.getByRole('link', { name: /sedes y canchas/i });
        const botonSalir = page.getByRole('button', { name: /cerrar sesión/i });
        await expect(botonSedes).toBeVisible();
        await expect(botonSalir).toBeVisible();
        await botonSedes.click();
      }

      await expect(page).toHaveURL(/\/admin\/sedes/);
      await expect(page.getByTestId('pagina-sedes')).toBeVisible();

      // Verificar que no hay scroll horizontal en /admin/sedes
      const scrollSedes = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(scrollSedes).toBe(true);
    }
  });

  test('Cierre de sesión desde el encabezado del administrador navega a Iniciar sesión', async ({
    page,
    request,
  }) => {
    const resLogin = await request.post('/api/auth/login', {
      data: {
        correo: 'admin@unbosque.edu.co',
        contrasena: 'admin2026',
      },
    });
    expect(resLogin.status()).toBe(200);

    const storageState = await request.storageState();
    await page.context().addCookies(storageState.cookies);

    await page.goto('/admin/torneos');
    const botonSalir = page.getByRole('button', { name: /cerrar sesión/i });
    await expect(botonSalir).toBeVisible();
    await botonSalir.click();

    await expect(page).toHaveURL(/\/iniciar-sesion/);
  });
});

