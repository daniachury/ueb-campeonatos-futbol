// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfilUsuario } from '@shared/usuarios/contrato-perfil';
import { JUGADOR_DE_PRUEBA, renderizarAppEn } from '../../../test/renderizar-app';
import { respuestaJson } from '../../../test/fetch-falso';

const PERFIL_INICIAL: PerfilUsuario = {
  id: 'jugador-001',
  nombreCompleto: 'Camilo Rojas',
  correo: 'camilo.rojas@mail.com',
  telefono: '3104567890',
  rol: 'jugador',
};

describe('MiPerfilPage (KAN-19 · UEB-Proyect-06)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/me' && method === 'GET') {
          return respuestaJson(PERFIL_INICIAL, 200);
        }
        if (url === '/api/me' && method === 'PATCH') {
          const body = JSON.parse(String(init?.body)) as Partial<PerfilUsuario> & {
            contrasenaActual?: string;
          };

          if (body.correo && body.correo !== PERFIL_INICIAL.correo) {
            if (body.contrasenaActual === 'clave-erronea') {
              return respuestaJson(
                {
                  codigo: 'CREDENCIALES_INCORRECTAS',
                  mensaje: 'La contraseña actual no es correcta',
                },
                401,
              );
            }
            if (body.correo === 'ocupado@mail.com') {
              return respuestaJson(
                {
                  codigo: 'CORREO_YA_REGISTRADO',
                  mensaje: 'Este correo ya está registrado',
                },
                409,
              );
            }
          }

          return respuestaJson(
            {
              ...PERFIL_INICIAL,
              ...body,
            },
            200,
          );
        }
        if (url === '/api/me/contrasena' && method === 'POST') {
          const body = JSON.parse(String(init?.body)) as { contrasenaActual: string };
          if (body.contrasenaActual === 'clave-erronea') {
            return respuestaJson(
              {
                codigo: 'CREDENCIALES_INCORRECTAS',
                mensaje: 'La contraseña actual no es correcta',
              },
              401,
            );
          }
          return respuestaJson({ mensaje: 'Contraseña actualizada' }, 200);
        }

        return respuestaJson({}, 404);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Escenario 5: carga los datos y el botón Guardar permanece deshabilitado si no hay cambios', async () => {
    renderizarAppEn('/mi-perfil', { usuarioInicial: JUGADOR_DE_PRUEBA });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Camilo Rojas')).toBeInTheDocument();
    });

    const botonGuardar = screen.getByRole('button', { name: /guardar/i });
    expect(botonGuardar).toBeDisabled();
  });

  it('Escenario 1: permite editar nombre y teléfono y muestra "Datos actualizados"', async () => {
    renderizarAppEn('/mi-perfil', { usuarioInicial: JUGADOR_DE_PRUEBA });

    await waitFor(() => {
      expect(screen.getByDisplayValue('3104567890')).toBeInTheDocument();
    });

    const campoTelefono = screen.getByDisplayValue('3104567890');
    fireEvent.change(campoTelefono, { target: { value: '3109876543' } });

    const botonGuardar = screen.getByRole('button', { name: /guardar/i });
    expect(botonGuardar).not.toBeDisabled();

    fireEvent.click(botonGuardar);

    await waitFor(() => {
      expect(screen.getByText('Datos actualizados')).toBeInTheDocument();
    });
  });

  it('Escenario 2: pide contraseña actual al cambiar correo y rechaza si es errónea', async () => {
    renderizarAppEn('/mi-perfil', { usuarioInicial: JUGADOR_DE_PRUEBA });

    await waitFor(() => {
      expect(screen.getByDisplayValue('camilo.rojas@mail.com')).toBeInTheDocument();
    });

    const campoCorreo = screen.getByDisplayValue('camilo.rojas@mail.com');
    fireEvent.change(campoCorreo, { target: { value: 'camilo.nuevo@mail.com' } });

    // Debe aparecer el campo de contraseña actual para confirmar el cambio de correo
    const campoContrasenaParaCorreo = await screen.findByLabelText(
      /contraseña actual para confirmar/i,
    );
    fireEvent.change(campoContrasenaParaCorreo, { target: { value: 'clave-erronea' } });

    const botonGuardar = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(botonGuardar);

    await waitFor(() => {
      expect(screen.getByText('La contraseña actual no es correcta')).toBeInTheDocument();
    });
  });

  it('Escenario 3: avisa si el nuevo correo ya pertenece a otra cuenta (409)', async () => {
    renderizarAppEn('/mi-perfil', { usuarioInicial: JUGADOR_DE_PRUEBA });

    await waitFor(() => {
      expect(screen.getByDisplayValue('camilo.rojas@mail.com')).toBeInTheDocument();
    });

    const campoCorreo = screen.getByDisplayValue('camilo.rojas@mail.com');
    fireEvent.change(campoCorreo, { target: { value: 'ocupado@mail.com' } });

    const campoContrasena = await screen.findByLabelText(/contraseña actual para confirmar/i);
    fireEvent.change(campoContrasena, { target: { value: 'balon2026' } });

    const botonGuardar = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(botonGuardar);

    await waitFor(() => {
      expect(screen.getByText('Este correo ya está registrado')).toBeInTheDocument();
    });
  });

  it('Escenario 4: permite actualizar contraseña e indica éxito', async () => {
    renderizarAppEn('/mi-perfil', { usuarioInicial: JUGADOR_DE_PRUEBA });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /actualizar contraseña/i })).toBeInTheDocument();
    });

    // Sección Seguridad
    const camposPassword = screen.getAllByLabelText(/contraseña/i);
    const campoActual = camposPassword.find((c) => (c as HTMLInputElement).id === 'campo-contrasena-actual');
    const campoNueva = camposPassword.find((c) => (c as HTMLInputElement).id === 'campo-nueva-contrasena');
    const campoConfirmar = camposPassword.find((c) => (c as HTMLInputElement).id === 'campo-confirmar-contrasena');

    fireEvent.change(campoActual!, { target: { value: 'balon2026' } });
    fireEvent.change(campoNueva!, { target: { value: 'NuevaClave2026*' } });
    fireEvent.change(campoConfirmar!, { target: { value: 'NuevaClave2026*' } });

    const botonCambiar = screen.getByRole('button', { name: /actualizar contraseña/i });
    expect(botonCambiar).not.toBeDisabled();

    fireEvent.click(botonCambiar);

    await waitFor(() => {
      expect(screen.getByText('Contraseña actualizada')).toBeInTheDocument();
    });
  });
});
