import { nuevoId, sufijoEnLetras } from '../identificadores';
import type { EstadoDeTorneo, TorneoDePrueba } from '../modelos';

/** Builder de torneos de prueba: por defecto con inscripciones abiertas y cupo para 8 equipos. */
export class ConstructorDeTorneo {
  #torneo: TorneoDePrueba = {
    id: nuevoId('torneo-e2e'),
    nombre: `Copa E2E ${sufijoEnLetras()}`,
    fechaInicio: '2026-12-05',
    cupo: 8,
    estado: 'INSCRIPCIONES_ABIERTAS',
  };

  conNombre(nombre: string): this {
    this.#torneo = { ...this.#torneo, nombre };
    return this;
  }

  conCupo(cupo: number): this {
    this.#torneo = { ...this.#torneo, cupo };
    return this;
  }

  enEstado(estado: EstadoDeTorneo): this {
    this.#torneo = { ...this.#torneo, estado };
    return this;
  }

  construir(): TorneoDePrueba {
    return { ...this.#torneo };
  }
}

export const unTorneo = () => new ConstructorDeTorneo();
