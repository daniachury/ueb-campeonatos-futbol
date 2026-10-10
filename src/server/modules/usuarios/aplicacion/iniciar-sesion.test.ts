import { describe, expect, it } from 'vitest';
import { ContrasenaCifrada } from '../dominio/objeto-valor/contrasena-cifrada';
import { CorreoElectronico } from '../dominio/objeto-valor/correo-electronico';
import { NombreCompleto } from '../dominio/objeto-valor/nombre-completo';
import { Telefono } from '../dominio/objeto-valor/telefono';
import { ROLES, type Rol } from '../dominio/rol';
import { Usuario } from '../dominio/usuario';
import { CifradorProvisionalEnTextoPlano } from '../infraestructura/cifrador-provisional-en-texto-plano';
import {
  ErrorCredencialesIncorrectas,
  ErrorCuentaDesactivada,
  ErrorDemasiadosIntentos,
} from './errores/errores-de-inicio-de-sesion';
import { IniciarSesion } from './iniciar-sesion';
import type {
  IntentosFallidos,
  RegistroDeIntentosFallidos,
} from './puertos/registro-de-intentos-fallidos';
import type { RepositorioDeUsuarios } from './puertos/repositorio-de-usuarios';

const CONTRASENA_DE_LAURA = 'balon2026';
const MINUTO = 60 * 1000;

function crearUsuario(correo: string, opciones: { rol?: Rol; activo?: boolean } = {}): Usuario {
  const fecha = new Date('2026-10-01T12:00:00Z');
  return Usuario.reconstituir({
    id: `id-${correo}`,
    nombreCompleto: NombreCompleto.crear('Laura Gómez'),
    correo: CorreoElectronico.crear(correo),
    telefono: Telefono.crear('3001234567'),
    contrasenaCifrada: ContrasenaCifrada.desdeHash(CONTRASENA_DE_LAURA),
    rol: opciones.rol ?? ROLES.JUGADOR,
    activo: opciones.activo ?? true,
    creadoEn: fecha,
    actualizadoEn: fecha,
  });
}

/** Doble de prueba: usuarios en un arreglo. */
class RepositorioDeUsuariosEnMemoria implements RepositorioDeUsuarios {
  constructor(readonly usuarios: Usuario[]) {}

  async existeConCorreo(correo: CorreoElectronico): Promise<boolean> {
    return this.usuarios.some((usuario) => usuario.correo.esIgualA(correo));
  }

  async buscarPorCorreo(correo: CorreoElectronico): Promise<Usuario | null> {
    return this.usuarios.find((usuario) => usuario.correo.esIgualA(correo)) ?? null;
  }

  async guardar(): Promise<void> {}
}

/** Doble de prueba: intentos en un Map por correo. */
class RegistroDeIntentosEnMemoria implements RegistroDeIntentosFallidos {
  readonly porCorreo = new Map<string, IntentosFallidos>();

  async obtener(correo: CorreoElectronico): Promise<IntentosFallidos> {
    return this.porCorreo.get(correo.valor) ?? { fallosSeguidos: 0, bloqueadoHasta: null };
  }

  async guardar(correo: CorreoElectronico, intentos: IntentosFallidos): Promise<void> {
    this.porCorreo.set(correo.valor, intentos);
  }

  async reiniciar(correo: CorreoElectronico): Promise<void> {
    this.porCorreo.delete(correo.valor);
  }
}

function prepararInicioDeSesion(usuarios: Usuario[] = [crearUsuario('laura@mail.com')]) {
  const reloj = { momento: new Date('2026-10-09T15:00:00Z'), ahora: () => reloj.momento };
  const registroDeIntentosFallidos = new RegistroDeIntentosEnMemoria();
  const iniciarSesion = new IniciarSesion({
    repositorioDeUsuarios: new RepositorioDeUsuariosEnMemoria(usuarios),
    cifradorDeContrasenas: new CifradorProvisionalEnTextoPlano(),
    registroDeIntentosFallidos,
    reloj,
  });
  const avanzarMinutos = (minutos: number) => {
    reloj.momento = new Date(reloj.momento.getTime() + minutos * MINUTO);
  };
  return { iniciarSesion, registroDeIntentosFallidos, avanzarMinutos };
}

async function fallarVeces(iniciarSesion: IniciarSesion, veces: number) {
  for (let intento = 0; intento < veces; intento++) {
    await iniciarSesion
      .ejecutar({ correo: 'laura@mail.com', contrasena: 'equivocada1' })
      .catch(() => undefined);
  }
}

describe('IniciarSesion (KAN-17)', () => {
  it('deja entrar a la jugadora aunque escriba el correo con mayúsculas (Escenario 1)', async () => {
    const { iniciarSesion } = prepararInicioDeSesion();

    const usuario = await iniciarSesion.ejecutar({
      correo: 'Laura@mail.com',
      contrasena: CONTRASENA_DE_LAURA,
    });

    expect(usuario).toEqual({
      id: 'id-laura@mail.com',
      nombreCompleto: 'Laura Gómez',
      correo: 'laura@mail.com',
      telefono: '3001234567',
      rol: 'jugador',
    });
    expect(JSON.stringify(usuario)).not.toContain(CONTRASENA_DE_LAURA);
  });

  it('devuelve el rol de administrador para que la app lo lleve a su menú (Escenario 2)', async () => {
    const { iniciarSesion } = prepararInicioDeSesion([
      crearUsuario('admin@mail.com', { rol: ROLES.ADMINISTRADOR }),
    ]);

    const usuario = await iniciarSesion.ejecutar({
      correo: 'admin@mail.com',
      contrasena: CONTRASENA_DE_LAURA,
    });

    expect(usuario.rol).toBe('admin');
  });

  it.each([
    ['un correo inexistente', 'nadie@mail.com', CONTRASENA_DE_LAURA],
    ['una contraseña incorrecta', 'laura@mail.com', 'equivocada1'],
    ['un correo sin formato válido', 'laura', CONTRASENA_DE_LAURA],
  ])('rechaza %s con el mismo error (Escenario 3)', async (_caso, correo, contrasena) => {
    const { iniciarSesion } = prepararInicioDeSesion();

    const intento = iniciarSesion.ejecutar({ correo, contrasena });

    await expect(intento).rejects.toThrow(ErrorCredencialesIncorrectas);
    await expect(intento).rejects.toThrow('Correo o contraseña incorrectos');
  });

  it('bloquea el correo en el quinto fallo seguido (Escenario 4)', async () => {
    const { iniciarSesion } = prepararInicioDeSesion();
    await fallarVeces(iniciarSesion, 4);

    const quintoIntento = iniciarSesion.ejecutar({
      correo: 'laura@mail.com',
      contrasena: 'equivocada1',
    });

    await expect(quintoIntento).rejects.toThrow(ErrorDemasiadosIntentos);
    await expect(quintoIntento).rejects.toThrow(
      'Demasiados intentos. Intenta de nuevo en 15 minutos',
    );
  });

  it('durante el bloqueo rechaza incluso la contraseña correcta y a los 15 minutos la acepta', async () => {
    const { iniciarSesion, avanzarMinutos } = prepararInicioDeSesion();
    await fallarVeces(iniciarSesion, 5);
    const credencialesCorrectas = { correo: 'laura@mail.com', contrasena: CONTRASENA_DE_LAURA };

    avanzarMinutos(14);
    await expect(iniciarSesion.ejecutar(credencialesCorrectas)).rejects.toThrow(
      ErrorDemasiadosIntentos,
    );

    avanzarMinutos(1);
    await expect(iniciarSesion.ejecutar(credencialesCorrectas)).resolves.toMatchObject({
      correo: 'laura@mail.com',
    });
  });

  it('un inicio exitoso devuelve el contador a cero (Escenario 4)', async () => {
    const { iniciarSesion, registroDeIntentosFallidos } = prepararInicioDeSesion();
    await fallarVeces(iniciarSesion, 4);

    await iniciarSesion.ejecutar({ correo: 'laura@mail.com', contrasena: CONTRASENA_DE_LAURA });
    await fallarVeces(iniciarSesion, 4);

    expect(registroDeIntentosFallidos.porCorreo.get('laura@mail.com')).toEqual({
      fallosSeguidos: 4,
      bloqueadoHasta: null,
    });
  });

  it('cuenta los fallos también para correos sin cuenta, para no revelar cuáles existen', async () => {
    const { iniciarSesion, registroDeIntentosFallidos } = prepararInicioDeSesion();

    await iniciarSesion
      .ejecutar({ correo: 'nadie@mail.com', contrasena: 'algo1234' })
      .catch(() => undefined);

    expect(registroDeIntentosFallidos.porCorreo.get('nadie@mail.com')?.fallosSeguidos).toBe(1);
  });

  it('avisa que la cuenta está desactivada solo si las credenciales son correctas (Escenario 5)', async () => {
    const { iniciarSesion } = prepararInicioDeSesion([
      crearUsuario('laura@mail.com', { activo: false }),
    ]);

    await expect(
      iniciarSesion.ejecutar({ correo: 'laura@mail.com', contrasena: 'equivocada1' }),
    ).rejects.toThrow(ErrorCredencialesIncorrectas);
    await expect(
      iniciarSesion.ejecutar({ correo: 'laura@mail.com', contrasena: CONTRASENA_DE_LAURA }),
    ).rejects.toThrow('Tu cuenta está desactivada. Contacta al administrador');
  });

  it('el error de cuenta desactivada es de su propia clase', async () => {
    const { iniciarSesion } = prepararInicioDeSesion([
      crearUsuario('laura@mail.com', { activo: false }),
    ]);

    await expect(
      iniciarSesion.ejecutar({ correo: 'laura@mail.com', contrasena: CONTRASENA_DE_LAURA }),
    ).rejects.toBeInstanceOf(ErrorCuentaDesactivada);
  });
});
