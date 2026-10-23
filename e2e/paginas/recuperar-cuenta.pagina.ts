import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

/** KAN-50 · Recuperación de cuenta. */
export class RecuperarCuentaPagina extends PaginaBase {
  protected readonly ruta = '/recuperar-cuenta';

  get titulo(): Locator {
    return this.page.getByRole('heading', { name: 'Recuperar cuenta' });
  }

  get campoCorreo(): Locator {
    return this.page.getByLabel(/Correo institucional o registrado/i);
  }

  get botonGenerar(): Locator {
    return this.page.getByRole('button', { name: 'Recuperar cuenta' });
  }

  get botonIrARestablecer(): Locator {
    return this.page.getByRole('button', { name: 'Ir a restablecer contraseña' });
  }

  get enlaceVolver(): Locator {
    return this.page.getByRole('link', { name: 'Iniciar sesión' });
  }

  async solicitarRecuperacion(correo: string): Promise<void> {
    await this.campoCorreo.fill(correo);
    await this.botonGenerar.click();
  }
}
