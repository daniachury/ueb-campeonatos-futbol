import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

export interface DatosDeSede {
  nombre: string;
  direccion: string;
  ciudad: string;
  indicaciones?: string;
}

export interface DatosDeCancha {
  nombre: string;
  superficie: 'Natural' | 'Sintética' | 'Otra';
}

/** KAN-34 · Sedes y canchas donde se juegan los partidos. */
export class SedesPagina extends PaginaBase {
  protected readonly ruta = '/admin/sedes';

  get contenido(): Locator {
    return this.page.getByTestId('pagina-sedes');
  }

  get estadoSinPermiso(): Locator {
    return this.page.getByTestId('estado-403');
  }

  get botonNuevaSede(): Locator {
    return this.page.getByRole('button', { name: /\+ nueva sede/i });
  }

  /** La tarjeta de una sede, con su dirección y sus canchas. */
  tarjetaDe(nombreDeLaSede: string): Locator {
    return this.page.locator('article', {
      has: this.page.getByRole('heading', { name: nombreDeLaSede }),
    });
  }

  async crearSede({ nombre, direccion, ciudad, indicaciones }: DatosDeSede): Promise<void> {
    await this.botonNuevaSede.click();
    const dialogo = this.page.getByRole('dialog');
    await dialogo.getByLabel(/nombre de la sede/i).fill(nombre);
    await dialogo.getByLabel(/dirección/i).fill(direccion);
    await dialogo.getByLabel(/ciudad/i).fill(ciudad);
    if (indicaciones) await dialogo.getByLabel(/indicaciones/i).fill(indicaciones);
    await dialogo.getByRole('button', { name: /guardar sede/i }).click();
  }

  async agregarCancha(nombreDeLaSede: string, { nombre, superficie }: DatosDeCancha) {
    await this.tarjetaDe(nombreDeLaSede)
      .getByRole('button', { name: /\+ agregar cancha/i })
      .click();
    const dialogo = this.page.getByRole('dialog');
    await dialogo.getByLabel(/nombre o número de cancha/i).fill(nombre);
    await dialogo.getByLabel(/superficie/i).selectOption(superficie);
    await dialogo.getByRole('button', { name: /guardar cancha/i }).click();
  }

  async volverAlInicio(): Promise<void> {
    await this.estadoSinPermiso.getByRole('link', { name: /volver al inicio/i }).click();
  }
}
