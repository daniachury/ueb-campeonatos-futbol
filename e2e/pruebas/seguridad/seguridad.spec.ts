import { expect, test } from '../../fixtures/pruebas';

/**
 * Controles de seguridad vistos desde el navegador: cabeceras, cookie de sesión y que la
 * API no exponga datos sensibles. Verifican los cambios de la auditoría de seguridad.
 */
test.describe('Seguridad', () => {
  test('el frontend se sirve con CSP y cabeceras de protección', async ({ page }) => {
    const respuesta = await page.goto('/iniciar-sesion');
    const cabeceras = respuesta!.headers();

    expect(cabeceras['content-security-policy']).toContain("default-src 'self'");
    expect(cabeceras['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(cabeceras['x-content-type-options']).toBe('nosniff');
    expect(cabeceras['x-frame-options']).toBe('DENY');
    expect(cabeceras['strict-transport-security']).toContain('max-age=');
  });

  test('la app funciona sin errores de CSP en la consola', async ({ page, escenarios, sesion }) => {
    const violacionesDeCsp: string[] = [];
    page.on('console', (mensaje) => {
      if (mensaje.type() === 'error' && /Content Security Policy/i.test(mensaje.text())) {
        violacionesDeCsp.push(mensaje.text());
      }
    });

    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    expect(violacionesDeCsp).toEqual([]);
  });

  test('la sesión viaja en una cookie __Host- HttpOnly, Secure y SameSite=Lax', async ({
    context,
    escenarios,
    sesion,
  }) => {
    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    const cookies = await context.cookies();
    const cookieDeSesion = cookies.find((cookie) => cookie.name === '__Host-sesion');

    expect(cookieDeSesion).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
    });
    expect(cookieDeSesion?.value).toMatch(/^[\w-]{43}$/);
  });

  test('JavaScript de la página no puede leer la cookie de sesión', async ({
    page,
    escenarios,
    sesion,
  }) => {
    await sesion.iniciarComo(await escenarios.jugadorRegistrado());

    const cookiesVisiblesParaJavaScript = await page.evaluate(() => document.cookie);

    expect(cookiesVisiblesParaJavaScript).not.toContain('__Host-sesion');
  });

  test('la API nunca devuelve la contraseña ni su hash', async ({ page, escenarios, sesion }) => {
    const jugador = await escenarios.jugadorRegistrado();
    const respuestaDeLogin = page.waitForResponse('**/api/auth/login');

    await sesion.iniciarComo(jugador);
    const cuerpo = await (await respuestaDeLogin).text();

    expect(cuerpo).toContain(jugador.correo);
    expect(cuerpo).not.toMatch(/contrasena|hash|pbkdf2/i);
  });
});
