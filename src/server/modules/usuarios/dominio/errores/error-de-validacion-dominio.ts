export type CampoDelUsuario = 'nombreCompleto' | 'correo' | 'telefono' | 'contrasena';

/**
 * Se lanza cuando un dato no cumple una regla del negocio.
 * Lleva el campo afectado para que la API y el formulario puedan
 * mostrar el mensaje justo debajo del campo correcto.
 */
export class ErrorDeValidacionDeDominio extends Error {
    readonly campo: CampoDelUsuario;

    constructor(campo: CampoDelUsuario, mensaje: string) {
        super(mensaje);
        this.name = 'ErrorDeValidacionDeDominio';
        this.campo = campo;
    }
}