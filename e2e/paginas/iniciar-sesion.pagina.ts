import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

export interface Credenciales {
  correo: string;
  contrasena: string;
}

/** v3 · M01 · Iniciar sesión (KAN-17). */
export class IniciarSesionPagina extends PaginaBase {
  protected readonly ruta = '/iniciar-sesion';

  get titulo(): Locator {
    return this.page.getByRole('heading', { name: 'Hola de nuevo' });
  }

  get campoCorreo(): Locator {
    return this.page.getByLabel('Correo', { exact: true });
  }

  get campoContrasena(): Locator {
    return this.page.getByLabel('Contraseña', { exact: true });
  }

  get botonIniciarSesion(): Locator {
    return this.page.getByRole('button', { name: 'Iniciar sesión', exact: true });
  }

  async iniciarSesionCon({ correo, contrasena }: Credenciales): Promise<void> {
    await this.campoCorreo.fill(correo);
    await this.campoContrasena.fill(contrasena);
    await this.botonIniciarSesion.click();
  }

  get enlaceOlvidoContrasena(): Locator {
    return this.page.getByRole('link', { name: '¿Olvidaste tu contraseña?' });
  }

  async irACrearCuenta(): Promise<void> {
    await this.page.locator('form').getByRole('link', { name: 'Crear cuenta' }).click();
  }

  async irARecuperarCuenta(): Promise<void> {
    await this.enlaceOlvidoContrasena.click();
  }
}
