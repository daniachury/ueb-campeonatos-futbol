import { test as base } from '@playwright/test';
import { ENTORNO } from '../configuracion/entorno';
import { PreparadorDeEscenarios } from '../dominio/escenarios/preparador-de-escenarios';
import type { AlmacenDeDatosDePrueba } from '../dominio/puertos/almacen-de-datos';
import { FlujoDeSesion } from '../flujos/sesion.flujo';
import { AlmacenD1Local } from '../infraestructura/almacen-d1-local';
import { CambiarContrasenaPagina } from '../paginas/cambiar-contrasena.pagina';
import { CrearCuentaPagina } from '../paginas/crear-cuenta.pagina';
import { GestionDeTorneosPagina } from '../paginas/gestion-de-torneos.pagina';
import { IniciarSesionPagina } from '../paginas/iniciar-sesion.pagina';
import { InicioDelJugadorPagina } from '../paginas/inicio-del-jugador.pagina';
import { InscripcionesPagina } from '../paginas/inscripciones.pagina';
import { MiPerfilPagina } from '../paginas/mi-perfil.pagina';
import { RegistrarAdministradorPagina } from '../paginas/registrar-administrador.pagina';

interface Paginas {
  iniciarSesion: IniciarSesionPagina;
  crearCuenta: CrearCuentaPagina;
  inicioDelJugador: InicioDelJugadorPagina;
  miPerfil: MiPerfilPagina;
  gestionDeTorneos: GestionDeTorneosPagina;
  registrarAdministrador: RegistrarAdministradorPagina;
  cambiarContrasena: CambiarContrasenaPagina;
  inscripciones: InscripcionesPagina;
}

interface Contexto {
  /** «Dado que…»: prepara datos de partida en lenguaje del negocio. */
  escenarios: PreparadorDeEscenarios;
  sesion: FlujoDeSesion;
}

interface ContextoDelTrabajador {
  /** Un adaptador de la base por cada proceso de Playwright. */
  almacen: AlmacenDeDatosDePrueba;
}

/**
 * Raíz de composición de las pruebas: el único lugar que une páginas, escenarios e
 * infraestructura. Las pruebas reciben todo listo por parámetro y no crean nada a mano.
 */
export const test = base.extend<Paginas & Contexto, ContextoDelTrabajador>({
  almacen: [
    // Playwright exige desestructurar el primer parámetro aunque no use otros fixtures.
    // eslint-disable-next-line no-empty-pattern
    async ({}, usar) => {
      await usar(
        new AlmacenD1Local({
          urlBase: ENTORNO.urlBase,
          rutaDeLaApi: ENTORNO.rutaDeLaApiDeD1,
          nombreDelBinding: ENTORNO.nombreDelBindingD1,
        }),
      );
    },
    { scope: 'worker' },
  ],
  escenarios: async ({ almacen }, usar) => usar(new PreparadorDeEscenarios(almacen)),
  sesion: async ({ page }, usar) => usar(new FlujoDeSesion(page)),

  iniciarSesion: async ({ page }, usar) => usar(new IniciarSesionPagina(page)),
  crearCuenta: async ({ page }, usar) => usar(new CrearCuentaPagina(page)),
  inicioDelJugador: async ({ page }, usar) => usar(new InicioDelJugadorPagina(page)),
  miPerfil: async ({ page }, usar) => usar(new MiPerfilPagina(page)),
  gestionDeTorneos: async ({ page }, usar) => usar(new GestionDeTorneosPagina(page)),
  registrarAdministrador: async ({ page }, usar) => usar(new RegistrarAdministradorPagina(page)),
  cambiarContrasena: async ({ page }, usar) => usar(new CambiarContrasenaPagina(page)),
  inscripciones: async ({ page }, usar) => usar(new InscripcionesPagina(page)),
});

export { expect } from '@playwright/test';
