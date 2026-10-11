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

  get enlaceSedesYCanchas(): Locator {
    return this.page.getByRole('link', { name: /sedes y canchas/i });
  }

  get botonCerrarSesion(): Locator {
    return this.page.getByRole('button', { name: 'Cerrar sesión' });
  }

  async irASedesYCanchas(): Promise<void> {
    await this.enlaceSedesYCanchas.click();
  }

  async irARegistrarAdministrador(): Promise<void> {
    await this.page.getByRole('button', { name: 'Registrar administrador' }).click();
  }

  async cerrarSesion(): Promise<void> {
    await this.botonCerrarSesion.click();
  }
}
