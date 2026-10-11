import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

/** v3 · A01 · Gestión de torneos: la pantalla de inicio del administrador. */
export class GestionDeTorneosPagina extends PaginaBase {
  protected readonly ruta = '/admin/torneos';

  get titulo(): Locator {
    return this.page.getByRole('heading', { name: 'Gestión de torneos' });
  }

  get saludo(): Locator {
    return this.page.getByText(/^Hola, /);
  }

  get botonMenuMovil(): Locator {
    return this.page.getByRole('button', { name: /abrir menú/i });
  }

  get enlaceSedesYCanchas(): Locator {
    return this.page.getByRole('link', { name: /sedes y canchas/i });
  }

  get botonCerrarSesion(): Locator {
    return this.page.getByRole('button', { name: 'Cerrar sesión' });
  }

  async irASedesYCanchas(): Promise<void> {
    if (await this.botonMenuMovil.isVisible()) {
      await this.botonMenuMovil.click();
      await this.page.getByTestId('menu-movil-admin').getByRole('link', { name: /sedes y canchas/i }).click();
    } else {
      await this.enlaceSedesYCanchas.click();
    }
  }

  async irARegistrarAdministrador(): Promise<void> {
    await this.page.getByRole('button', { name: 'Registrar administrador' }).click();
  }

  async cerrarSesion(): Promise<void> {
    if (await this.botonMenuMovil.isVisible()) {
      await this.botonMenuMovil.click();
      await this.page.getByTestId('menu-movil-admin').getByRole('button', { name: /cerrar sesión/i }).click();
    } else {
      await this.botonCerrarSesion.click();
    }
  }
}
