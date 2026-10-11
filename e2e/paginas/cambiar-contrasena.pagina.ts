import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

/** KAN-18 · Cambio obligatorio de la contraseña temporal en el primer ingreso. */
export class CambiarContrasenaPagina extends PaginaBase {
  protected readonly ruta = '/cambiar-contrasena';

  get titulo(): Locator {
    return this.page.getByRole('heading', { name: 'Cambia tu contraseña' });
  }

  async cambiar(actual: string, nueva: string): Promise<void> {
    await this.page.getByLabel('Contraseña actual / temporal').fill(actual);
    await this.page.getByLabel('Nueva contraseña', { exact: true }).fill(nueva);
    await this.page.getByLabel('Confirmar nueva contraseña').fill(nueva);
    await this.page.getByRole('button', { name: 'Actualizar contraseña' }).click();
  }
}
