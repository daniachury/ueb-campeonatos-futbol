import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

/** v3 · M11 / W04 · Inicio del jugador, con el menú lateral de escritorio. */
export class InicioDelJugadorPagina extends PaginaBase {
  protected readonly ruta = '/inicio';

  get nombreDelJugador(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get mensajeDeBienvenida(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'Tu cuenta fue creada' });
  }

  get menuDelJugador(): Locator {
    return this.page.getByRole('navigation', { name: 'Menú del jugador' });
  }

  async irAMiPerfil(): Promise<void> {
    await this.menuDelJugador.getByRole('link', { name: 'Mi perfil' }).click();
  }

  async cerrarSesion(): Promise<void> {
    await this.page.getByRole('button', { name: 'Cerrar sesión' }).click();
  }
}
