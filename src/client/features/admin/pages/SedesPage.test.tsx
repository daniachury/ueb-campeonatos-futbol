// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import type { SedeResumen } from '@shared/sedes/contrato-sedes';
import { respuestaJson } from '../../../test/fetch-falso';
import { renderizarAppEn } from '../../../test/renderizar-app';

const ADMIN_DE_PRUEBA: UsuarioAutenticado = {
  id: 'admin-001',
  nombreCompleto: 'Edwar Alméciga',
  correo: 'ealmmeciga@unbosque.edu.co',
  telefono: '3101234567',
  rol: 'admin',
};

const JUGADOR_DE_PRUEBA: UsuarioAutenticado = {
  id: 'jugador-001',
  nombreCompleto: 'Camilo Jugador',
  correo: 'camilo@mail.com',
  telefono: '3109999999',
  rol: 'jugador',
};

const SEDES_EJEMPLO: SedeResumen[] = [
  {
    id: 'sede-1',
    nombre: 'Complejo El Bosque',
    direccion: 'Av. Cra 9 # 131A-02',
    ciudad: 'Bogotá',
    indicaciones: 'Entrada por portería norte',
    totalCanchas: 2,
    totalPartidosProgramados: 3,
    canchas: [
      {
        id: 'cancha-1',
        sedeId: 'sede-1',
        nombre: 'Cancha 1',
        superficie: 'Sintética',
        activa: true,
        partidosProgramados: 3,
        creadoEn: '2026-10-11T10:00:00Z',
        actualizadoEn: '2026-10-11T10:00:00Z',
      },
      {
        id: 'cancha-2',
        sedeId: 'sede-1',
        nombre: 'Cancha 2',
        superficie: 'Natural',
        activa: false,
        partidosProgramados: 0,
        creadoEn: '2026-10-11T10:00:00Z',
        actualizadoEn: '2026-10-11T10:00:00Z',
      },
    ],
    creadoEn: '2026-10-11T10:00:00Z',
    actualizadoEn: '2026-10-11T10:00:00Z',
  },
];

describe('SedesPage (KAN-34)', () => {
  it('Escenario 1: Renderiza el listado de sedes con sus canchas', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (info) => {
      const url = String(info);
      if (url.includes('/api/admin/sedes')) {
        return respuestaJson(SEDES_EJEMPLO);
      }
      return respuestaJson({}, 404);
    });

    renderizarAppEn('/admin/sedes', { usuarioInicial: ADMIN_DE_PRUEBA });

    expect(await screen.findByText('Complejo El Bosque')).toBeInTheDocument();
    expect(screen.getByText(/Av\. Cra 9 # 131A-02/i)).toBeInTheDocument();
    expect(screen.getByText('Cancha 1')).toBeInTheDocument();
    expect(screen.getByText('Cancha 2')).toBeInTheDocument();
    expect(screen.getByText('Sintética')).toBeInTheDocument();
  });

  it('Escenario 1: Abre modal para crear sede y envía petición', async () => {
    let peticionEnviada: unknown = null;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (info, init) => {
      const url = String(info);
      if (url.endsWith('/api/admin/sedes') && init?.method === 'POST') {
        peticionEnviada = JSON.parse(String(init.body));
        return respuestaJson({
          id: 'sede-2',
          nombre: 'Campus Chía',
          direccion: 'Km 2 Vía Chía',
          ciudad: 'Chía',
          totalCanchas: 0,
          totalPartidosProgramados: 0,
          canchas: [],
          creadoEn: '2026-10-11T10:00:00Z',
          actualizadoEn: '2026-10-11T10:00:00Z',
        }, 201);
      }
      if (url.includes('/api/admin/sedes')) {
        return respuestaJson(SEDES_EJEMPLO);
      }
      return respuestaJson({}, 404);
    });

    renderizarAppEn('/admin/sedes', { usuarioInicial: ADMIN_DE_PRUEBA });

    const botonNuevaSede = await screen.findByRole('button', { name: /nueva sede/i });
    fireEvent.click(botonNuevaSede);

    expect(screen.getByRole('heading', { name: /nueva sede/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/nombre de la sede/i), {
      target: { value: 'Campus Chía' },
    });
    fireEvent.change(screen.getByLabelText(/dirección/i), {
      target: { value: 'Km 2 Vía Chía' },
    });
    fireEvent.change(screen.getByLabelText(/ciudad/i), {
      target: { value: 'Chía' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar sede/i }));

    expect(peticionEnviada).toEqual({
      nombre: 'Campus Chía',
      direccion: 'Km 2 Vía Chía',
      ciudad: 'Chía',
      indicaciones: undefined,
    });
  });

  it('Escenario 2: Permite agregar una cancha a la sede', async () => {
    let canchaEnviada: unknown = null;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (info, init) => {
      const url = String(info);
      if (url.includes('/api/admin/sedes/sede-1/canchas') && init?.method === 'POST') {
        canchaEnviada = JSON.parse(String(init.body));
        return respuestaJson({
          id: 'cancha-3',
          sedeId: 'sede-1',
          nombre: 'Cancha 3',
          superficie: 'Sintética',
          activa: true,
          partidosProgramados: 0,
          creadoEn: '2026-10-11T10:00:00Z',
          actualizadoEn: '2026-10-11T10:00:00Z',
        }, 201);
      }
      if (url.includes('/api/admin/sedes')) {
        return respuestaJson(SEDES_EJEMPLO);
      }
      return respuestaJson({}, 404);
    });

    renderizarAppEn('/admin/sedes', { usuarioInicial: ADMIN_DE_PRUEBA });

    const botonAgregarCancha = await screen.findByRole('button', { name: /agregar cancha/i });
    fireEvent.click(botonAgregarCancha);

    fireEvent.change(screen.getByLabelText(/nombre o número de cancha/i), {
      target: { value: 'Cancha 3' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar cancha/i }));

    expect(canchaEnviada).toEqual(
      expect.objectContaining({
        nombre: 'Cancha 3',
      }),
    );
  });

  it('Escenario 6: Eliminar cancha con partidos muestra error 409', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (info, init) => {
      const url = String(info);
      if (url.includes('/api/admin/sedes/sede-1/canchas/cancha-1') && init?.method === 'DELETE') {
        return respuestaJson(
          {
            codigo: 'ERROR_ELIMINACION',
            mensaje: 'No se puede eliminar: tiene 3 partidos programados. Reprográmalos o desactiva la cancha',
          },
          409,
        );
      }
      if (url.includes('/api/admin/sedes')) {
        return respuestaJson(SEDES_EJEMPLO);
      }
      return respuestaJson({}, 404);
    });

    renderizarAppEn('/admin/sedes', { usuarioInicial: ADMIN_DE_PRUEBA });

    const botonEliminarCancha1 = await screen.findByTestId('eliminar-cancha-cancha-1');
    fireEvent.click(botonEliminarCancha1);

    // Confirmar en el modal
    const botonConfirmar = await screen.findByRole('button', { name: /confirmar eliminación/i });
    fireEvent.click(botonConfirmar);

    expect(
      await screen.findByText(/No se puede eliminar: tiene 3 partidos programados/i),
    ).toBeInTheDocument();
  });

  it('Escenario 8: Un usuario con rol jugador ve estado 403 claro con botón para volver al inicio', async () => {
    renderizarAppEn('/admin/sedes', { usuarioInicial: JUGADOR_DE_PRUEBA });

    expect(screen.getByTestId('estado-403')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: /acceso no autorizado \(403\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No tienes permisos de administrador para gestionar sedes y canchas/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute(
      'href',
      '/inicio',
    );
    expect(screen.queryByRole('button', { name: /\+ nueva sede/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Complejo El Bosque/i)).not.toBeInTheDocument();
  });
});
