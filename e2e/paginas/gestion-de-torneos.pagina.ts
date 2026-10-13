import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

export interface DatosNuevoTorneo {
  nombre: string;
  descripcion?: string;
  fechaInicio?: string;
  cupo?: number;
}

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

  get botonNuevoTorneo(): Locator {
    return this.page.locator('#btn-nuevo-torneo');
  }

  async irASedesYCanchas(): Promise<void> {
    if (await this.botonMenuMovil.isVisible()) {
      await this.botonMenuMovil.click();
      await this.page
        .getByTestId('menu-movil-admin')
        .getByRole('link', { name: /sedes y canchas/i })
        .click();
    } else {
      await this.enlaceSedesYCanchas.click();
    }
  }

  async irARegistrarAdministrador(): Promise<void> {
    // El encabezado de administración lo muestra como «Registrar admin».
    await this.page.getByRole('button', { name: /^Registrar admin/ }).click();
  }

  async cerrarSesion(): Promise<void> {
    if (await this.botonMenuMovil.isVisible()) {
      await this.botonMenuMovil.click();
      await this.page
        .getByTestId('menu-movil-admin')
        .getByRole('button', { name: /cerrar sesión/i })
        .click();
    } else {
      await this.botonCerrarSesion.click();
    }
  }

  async abrirModalNuevoTorneo(): Promise<void> {
    await this.botonNuevoTorneo.click();
    await this.page.locator('#titulo-modal-crear-torneo').waitFor({ state: 'visible' });
  }

  async diligenciarYGuardarTorneo(datos: DatosNuevoTorneo): Promise<void> {
    await this.page.locator('#nombre-torneo').fill(datos.nombre);
    if (datos.descripcion) {
      await this.page.locator('#descripcion-torneo').fill(datos.descripcion);
    }
    if (datos.fechaInicio) {
      await this.page.locator('#fecha-inicio-torneo').fill(datos.fechaInicio);
    }
    if (datos.cupo) {
      await this.page.locator('#cupo-torneo').fill(datos.cupo.toString());
    }
    await this.page.locator('#btn-guardar-torneo').click();
  }

  async abrirInscripciones(torneoId: string): Promise<void> {
    const btn = this.page.locator(`#btn-abrir-inscripciones-${torneoId}`);
    await btn.click();
    await this.page.locator('#titulo-modal-confirmar-apertura').waitFor({ state: 'visible' });
    await this.page.locator('#btn-confirmar-apertura-modal').click();
  }
}
