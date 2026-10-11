import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

export interface DatosDeAdministrador {
  nombreCompleto: string;
  correo: string;
  telefono: string;
}

/** KAN-18 · Registrar administrador (y promover a un jugador existente). */
export class RegistrarAdministradorPagina extends PaginaBase {
  protected readonly ruta = '/admin/usuarios/nuevo';

  get titulo(): Locator {
    return this.page.getByRole('heading', { name: 'Registrar administrador', level: 1 });
  }

  async registrar({ nombreCompleto, correo, telefono }: DatosDeAdministrador): Promise<void> {
    await this.page.getByLabel('Nombre completo').fill(nombreCompleto);
    await this.page.getByLabel('Correo electrónico').fill(correo);
    await this.page.getByLabel('Teléfono').fill(telefono);
    await this.page
      .locator('form')
      .getByRole('button', { name: 'Registrar administrador' })
      .click();
  }

  get dialogoAdministradorRegistrado(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: '¡Administrador registrado!' });
  }

  async contrasenaTemporal(): Promise<string> {
    const texto = await this.page.locator('#texto-contrasena-temporal').textContent();
    return (texto ?? '').trim();
  }

  async cerrarDialogo(): Promise<void> {
    await this.dialogoAdministradorRegistrado.getByRole('button', { name: 'Entendido' }).click();
  }

  get dialogoDePromocion(): Locator {
    return this.page.getByRole('dialog').filter({ hasText: 'El correo pertenece a un jugador' });
  }

  async promoverAlJugador(): Promise<void> {
    await this.dialogoDePromocion.getByRole('button', { name: 'Promover a administrador' }).click();
  }
}
