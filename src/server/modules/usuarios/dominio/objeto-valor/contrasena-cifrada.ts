/**
 * El hash de la contraseña (bcrypt o argon2).
 *
 * El dominio NO sabe cómo se calcula el hash: eso es un detalle de infraestructura (Paso 4).
 * Aquí solo se garantiza que exista y que nunca salga en una respuesta de la API
 * (KAN-16 · Escenario 5): toJSON() devuelve undefined, así JSON.stringify omite la propiedad.
 */
export class ContrasenaCifrada {
    readonly #hash: string;

    private constructor(hash: string) {
        this.#hash = hash;
    }

    static desdeHash(hash: string): ContrasenaCifrada {
        if (hash.trim().length === 0) {
            throw new Error('El hash de la contraseña no puede estar vacío');
        }
        return new ContrasenaCifrada(hash);
    }

    /** Solo para el repositorio que la guarda en la base de datos. */
    obtenerHashParaGuardar(): string {
        return this.#hash;
    }

    toString(): string {
        return '[hash oculto]';
    }

    toJSON(): undefined {
        return undefined;
    }
}