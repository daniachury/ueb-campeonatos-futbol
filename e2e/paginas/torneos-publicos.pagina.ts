import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

/** Listado público de torneos (KAN-23): lo que ve cualquier persona, con o sin sesión. */
export class TorneosPublicosPagina extends PaginaBase {
  protected readonly ruta = '/torneos';

  /** La tarjeta de un torneo, con su estado, fecha de inicio y cupo. */
  tarjetaDe(nombreDelTorneo: string): Locator {
    return this.page
      .locator('article')
      .filter({ has: this.page.getByRole('heading', { name: nombreDelTorneo }) });
  }

  /** Espera a que termine de cargar, para que «no aparece» signifique algo. */
  async abrirYEsperarListado(): Promise<void> {
    await this.abrir();
    await this.page.getByText('Cargando torneos…').waitFor({ state: 'hidden' });
  }
}
