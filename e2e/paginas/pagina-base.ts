import type { Locator, Page } from '@playwright/test';

/**
 * Base de todos los Page Objects: cada pantalla sabe su ruta y cómo se ven sus avisos.
 * Los Page Objects exponen acciones del negocio y elementos para verificar; las aserciones
 * viven en las pruebas.
 */
export abstract class PaginaBase {
  protected readonly page: Page;
  protected abstract readonly ruta: string;

  constructor(page: Page) {
    this.page = page;
  }

  async abrir(): Promise<void> {
    await this.page.goto(this.ruta);
  }

  /** Aviso rojo de la app (componente Aviso, role="alert"). */
  get avisoDeError(): Locator {
    return this.page.getByRole('alert');
  }

  /** Aviso informativo o de confirmación (role="status"). */
  get avisoInformativo(): Locator {
    return this.page.getByRole('status');
  }
}
