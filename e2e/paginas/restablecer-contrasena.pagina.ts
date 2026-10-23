import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

/** KAN-50 · Restablecimiento de contraseña con token. */
export class RestablecerContrasenaPagina extends PaginaBase {
  protected readonly ruta = '/restablecer-contrasena';

  get titulo(): Locator {
    return this.page.getByRole('heading', { name: 'Restablecer contraseña' });
  }

  get campoNuevaContrasena(): Locator {
    return this.page.getByLabel('Nueva contraseña', { exact: true });
  }

  get campoConfirmarContrasena(): Locator {
    return this.page.getByLabel('Confirmar contraseña', { exact: true });
  }

  get botonRestablecer(): Locator {
    return this.page.getByRole('button', { name: 'Guardar nueva contraseña' });
  }

  get botonIrAIniciarSesion(): Locator {
    return this.page.getByRole('button', { name: 'Iniciar sesión' });
  }

  get botonSolicitarNuevoEnlace(): Locator {
    return this.page.getByRole('button', { name: 'Solicitar nuevo enlace' });
  }

  get enlaceVolver(): Locator {
    return this.page.getByRole('link', { name: 'Volver a iniciar sesión' });
  }

  async abrirConToken(token: string): Promise<void> {
    await this.page.goto(`${this.ruta}?token=${encodeURIComponent(token)}`);
  }

  async restablecer(nueva: string, confirmar: string = nueva): Promise<void> {
    await this.campoNuevaContrasena.fill(nueva);
    await this.campoConfirmarContrasena.fill(confirmar);
    await this.botonRestablecer.click();
  }
}
