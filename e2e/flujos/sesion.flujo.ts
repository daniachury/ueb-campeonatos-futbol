import { expect, type Page } from '@playwright/test';
import type { UsuarioDePrueba } from '../dominio/modelos';
import { IniciarSesionPagina } from '../paginas/iniciar-sesion.pagina';

/** Pantalla a la que la app lleva a cada rol después de iniciar sesión (KAN-17 · Escenarios 1 y 2). */
export const INICIO_SEGUN_ROL = {
  jugador: /\/inicio$/,
  admin: /\/admin$/,
} as const;

/**
 * Flujo de sesión: combina pantallas para dejar a un usuario dentro de la app.
 * Entra por la pantalla de inicio de sesión, como una persona real, y espera su pantalla de inicio.
 */
export class FlujoDeSesion {
  readonly #page: Page;

  constructor(page: Page) {
    this.#page = page;
  }

  async iniciarComo(usuario: UsuarioDePrueba): Promise<void> {
    const iniciarSesion = new IniciarSesionPagina(this.#page);
    await iniciarSesion.abrir();
    await iniciarSesion.iniciarSesionCon(usuario);
    await expect(this.#page).toHaveURL(INICIO_SEGUN_ROL[usuario.rol]);
  }
}
