import type { Locator } from '@playwright/test';
import type { UsuarioDePrueba } from '../dominio/modelos';
import { PaginaBase } from './pagina-base';

/** v3 · M02 · Crear cuenta de jugador (KAN-16). */
export class CrearCuentaPagina extends PaginaBase {
  protected readonly ruta = '/crear-cuenta';

  get campoNombreCompleto(): Locator {
    return this.page.getByLabel('Nombre completo');
  }

  get campoCorreo(): Locator {
    return this.page.getByLabel('Correo', { exact: true });
  }

  get campoTelefono(): Locator {
    return this.page.getByLabel('Teléfono');
  }

  get campoContrasena(): Locator {
    return this.page.getByLabel('Contraseña', { exact: true });
  }

  get campoConfirmarContrasena(): Locator {
    return this.page.getByLabel('Confirmar contraseña');
  }

  get botonCrearCuenta(): Locator {
    return this.page.locator('form').getByRole('button', { name: 'Crear cuenta' });
  }

  async llenarFormulario(usuario: UsuarioDePrueba): Promise<void> {
    await this.campoNombreCompleto.fill(usuario.nombreCompleto);
    await this.campoCorreo.fill(usuario.correo);
    await this.campoTelefono.fill(usuario.telefono);
    await this.campoContrasena.fill(usuario.contrasena);
    await this.campoConfirmarContrasena.fill(usuario.contrasena);
  }

  async registrarse(usuario: UsuarioDePrueba): Promise<void> {
    await this.llenarFormulario(usuario);
    await this.botonCrearCuenta.click();
  }
}
