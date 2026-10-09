/**
 * Clase base de los objetos de valor que envuelven un texto ya validado y normalizado.
 *
 * - Inmutable: el valor solo se asigna al construirse (readonly).
 * - Se compara por valor, no por referencia: dos correos "laura@mail.com" son el mismo correo.
 * - Las subclases deciden CÓMO se valida; esta base solo guarda y compara.
 */
export abstract class ObjetoDeValorDeTexto {
    readonly valor: string;

    protected constructor(valorValidado: string) {
        this.valor = valorValidado;
    }

    esIgualA(otro: ObjetoDeValorDeTexto): boolean {
        return this.constructor === otro.constructor && this.valor === otro.valor;
    }

    toString(): string {
        return this.valor;
    }

    toJSON(): string {
        return this.valor;
    }
}