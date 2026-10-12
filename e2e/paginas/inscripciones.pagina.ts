import type { Locator } from '@playwright/test';
import { PaginaBase } from './pagina-base';

type Pestana = 'Pendientes' | 'Aprobados' | 'Rechazados' | 'Fixture';

/** v3 · A02 · Inscripciones y sorteo de un torneo (KAN-32 y KAN-33). */
export class InscripcionesPagina extends PaginaBase {
  protected ruta = '/admin/torneos';

  async abrirDelTorneo(torneoId: string): Promise<void> {
    this.ruta = `/admin/torneos/${torneoId}/inscripciones`;
    await this.abrir();
  }

  get nombreDelTorneo(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get contadorDeCupos(): Locator {
    return this.page.getByLabel('Contador de cupos');
  }

  pestana(nombre: Pestana): Locator {
    return this.page.getByRole('tab', { name: new RegExp(nombre) });
  }

  async verPestana(nombre: Pestana): Promise<void> {
    await this.pestana(nombre).click();
  }

  /** La tarjeta de la solicitud de un equipo en la pestaña activa. */
  solicitudDe(nombreDelEquipo: string): Locator {
    return this.page
      .getByRole('heading', { name: nombreDelEquipo, level: 2 })
      .locator('xpath=ancestor::*[.//button][1]');
  }

  async aprobar(nombreDelEquipo: string): Promise<void> {
    await this.solicitudDe(nombreDelEquipo).getByRole('button', { name: 'Aprobar' }).click();
  }

  async rechazar(nombreDelEquipo: string, motivo: string): Promise<void> {
    await this.solicitudDe(nombreDelEquipo).getByRole('button', { name: 'Rechazar' }).click();
    const dialogo = this.page.getByRole('dialog');
    await dialogo.getByRole('textbox').fill(motivo);
    await dialogo.getByRole('button', { name: 'Rechazar solicitud' }).click();
  }

  get botonSortear(): Locator {
    return this.page.getByRole('button', { name: /Cerrar inscripciones y sortear/ });
  }

  async cerrarInscripcionesYSortear(): Promise<void> {
    await this.botonSortear.click();
    await this.page
      .getByRole('dialog', { name: /Cerrar inscripciones y sortear/ })
      .getByRole('button', { name: 'Confirmar y sortear' })
      .click();
  }

  get avisoDeTorneoEnCurso(): Locator {
    return this.page.getByText('El torneo se encuentra en curso');
  }

  get vistaFixture(): Locator {
    return this.page.getByTestId('vista-fixture');
  }

  get primerBotonProgramar(): Locator {
    return this.page.locator('[id^="btn-programar-partido-"]').first();
  }

  get segundoBotonProgramar(): Locator {
    return this.page.locator('[id^="btn-programar-partido-"]').nth(1);
  }

  get modalProgramar(): Locator {
    return this.page.getByTestId('modal-programar-partido');
  }

  get alertaConflicto(): Locator {
    return this.page.getByTestId('alerta-conflicto-horario');
  }

  async programarPartido(canchaIdOTexto: string, fechaHora: string): Promise<void> {
    const select = this.page.getByTestId('select-cancha-partido');
    const options = await select.locator('option').all();
    let seleccionada = false;
    for (const opt of options) {
      const val = await opt.getAttribute('value');
      const text = await opt.textContent();
      if (val && (val === canchaIdOTexto || text?.includes(canchaIdOTexto))) {
        await select.selectOption(val);
        seleccionada = true;
        break;
      }
    }
    if (!seleccionada) {
      await select.selectOption({ index: 1 });
    }
    await this.page.getByTestId('input-fecha-hora-partido').fill(fechaHora);
    await this.page.getByRole('button', { name: /Programar partido|Guardar cambios/ }).click();
  }

  async desprogramarPartido(): Promise<void> {
    await this.page.getByTestId('btn-desprogramar-partido').click();
  }
}

