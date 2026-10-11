import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

export interface CambiosDeDatos {
  nombreCompleto?: string;
  telefono?: string;
}

/** v3 · Mi perfil (KAN-19): datos personales y cambio de contraseña. */
export class MiPerfilPagina extends PaginaBase {
  protected readonly ruta = '/mi-perfil';

  get seccionDatosPersonales(): Locator {
    return this.page.getByRole('region', { name: 'Datos personales' });
  }

  get seccionSeguridad(): Locator {
    return this.page.getByRole('region', { name: /seguridad|contraseña/i });
  }

  get nombreEnElEncabezado(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get campoNombreCompleto(): Locator {
    return this.seccionDatosPersonales.getByLabel('Nombre completo');
  }

  get campoTelefono(): Locator {
    return this.seccionDatosPersonales.getByLabel('Teléfono');
  }

  async actualizarDatos({ nombreCompleto, telefono }: CambiosDeDatos): Promise<void> {
    if (nombreCompleto !== undefined) await this.campoNombreCompleto.fill(nombreCompleto);
    if (telefono !== undefined) await this.campoTelefono.fill(telefono);
    await this.seccionDatosPersonales.getByRole('button', { name: 'Guardar' }).click();
  }

  async cambiarContrasena(actual: string, nueva: string): Promise<void> {
    await this.seccionSeguridad.getByLabel('Contraseña actual', { exact: true }).fill(actual);
    await this.seccionSeguridad.getByLabel('Nueva contraseña', { exact: true }).fill(nueva);
    await this.seccionSeguridad.getByLabel('Confirmar nueva contraseña').fill(nueva);
    await this.seccionSeguridad.getByRole('button', { name: 'Actualizar contraseña' }).click();
  }
}
