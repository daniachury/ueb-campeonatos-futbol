import { ROLES, type Rol } from './rol';
import type { ContrasenaCifrada } from './objeto-valor/contrasena-cifrada';
import type { CorreoElectronico } from './objeto-valor/correo-electronico';
import type { NombreCompleto } from './objeto-valor/nombre-completo';
import type { Telefono } from './objeto-valor/telefono';

interface PropiedadesDelUsuario {
    id: string;
    nombreCompleto: NombreCompleto;
    correo: CorreoElectronico;
    telefono: Telefono;
    contrasenaCifrada: ContrasenaCifrada;
    rol: Rol;
    activo: boolean;
    creadoEn: Date;
    actualizadoEn: Date;
}

export interface DatosParaRegistrarJugador {
    id: string;
    nombreCompleto: NombreCompleto;
    correo: CorreoElectronico;
    telefono: Telefono;
    contrasenaCifrada: ContrasenaCifrada;
    fechaDeRegistro: Date;
}

/**
 * Entidad Usuario: tiene identidad propia (id) y reúne objetos de valor ya validados.
 * Si existe un Usuario, sus datos son válidos: no hay forma de construir uno "a medias".
 */
export class Usuario {
    readonly id: string;
    readonly nombreCompleto: NombreCompleto;
    readonly correo: CorreoElectronico;
    readonly telefono: Telefono;
    readonly contrasenaCifrada: ContrasenaCifrada;
    readonly rol: Rol;
    readonly activo: boolean;
    readonly creadoEn: Date;
    readonly actualizadoEn: Date;

    private constructor(propiedades: PropiedadesDelUsuario) {
        this.id = propiedades.id;
        this.nombreCompleto = propiedades.nombreCompleto;
        this.correo = propiedades.correo;
        this.telefono = propiedades.telefono;
        this.contrasenaCifrada = propiedades.contrasenaCifrada;
        this.rol = propiedades.rol;
        this.activo = propiedades.activo;
        this.creadoEn = propiedades.creadoEn;
        this.actualizadoEn = propiedades.actualizadoEn;
    }

    /**
     * Única forma de crear un usuario desde el registro público.
     * Fíjate que NO recibe rol: un jugador registrado siempre nace como Jugador.
     * Así el Escenario 4 de KAN-16 (intentar registrarse como admin) se cumple por diseño.
     */
    static registrarJugador(datos: DatosParaRegistrarJugador): Usuario {
        return new Usuario({
            id: datos.id,
            nombreCompleto: datos.nombreCompleto,
            correo: datos.correo,
            telefono: datos.telefono,
            contrasenaCifrada: datos.contrasenaCifrada,
            rol: ROLES.JUGADOR,
            activo: true,
            creadoEn: datos.fechaDeRegistro,
            actualizadoEn: datos.fechaDeRegistro,
        });
    }

    esJugador(): boolean {
        return this.rol === ROLES.JUGADOR;
    }
}