// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsuarioAutenticado } from '@shared/usuarios/contrato-inicio-de-sesion';
import { ApiError } from '../../../common/api/client';
import { RUTAS } from '../../../common/navegacion';
import { ProveedorDeSesion } from '../../../common/sesion/ProveedorDeSesion';
import { crearServicioDeSesionFalso } from '../../../test/renderizar-app';
import * as adminApi from '../api';
import { RegistrarAdminPage } from './RegistrarAdminPage';

vi.mock('../api', () => ({
  registrarAdmin: vi.fn(),
  promoverJugador: vi.fn(),
}));

const ADMIN_AUTENTICADO: UsuarioAutenticado = {
  id: 'admin-1',
  nombreCompleto: 'Admin Jefe',
  correo: 'admin@unbosque.edu.co',
  telefono: '3001234567',
  rol: 'admin',
  debeCambiarContrasena: false,
};

function renderizarPagina(usuario: UsuarioAutenticado | null = ADMIN_AUTENTICADO) {
  const servicioDeSesion = crearServicioDeSesionFalso();
  return render(
    <ProveedorDeSesion servicioDeSesion={servicioDeSesion} usuarioInicial={usuario}>
      <MemoryRouter initialEntries={[RUTAS.REGISTRAR_ADMIN]}>
        <Routes>
          <Route path={RUTAS.REGISTRAR_ADMIN} element={<RegistrarAdminPage />} />
          <Route path={RUTAS.INICIAR_SESION} element={<div>Pantalla Iniciar Sesion</div>} />
          <Route path={RUTAS.INICIO_DEL_JUGADOR} element={<div>Pantalla Inicio Jugador</div>} />
          <Route path={RUTAS.CAMBIAR_CONTRASENA} element={<div>Pantalla Cambiar Contrasena</div>} />
          <Route path={RUTAS.GESTION_DE_TORNEOS} element={<div>Pantalla Gestion Torneos</div>} />
        </Routes>
      </MemoryRouter>
    </ProveedorDeSesion>,
  );
}

describe('RegistrarAdminPage (KAN-18 · Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirige a Iniciar sesión si no hay usuario autenticado', () => {
    renderizarPagina(null);
    expect(screen.getByText('Pantalla Iniciar Sesion')).toBeInTheDocument();
  });

  it('redirige al inicio de jugador si el usuario es un jugador', () => {
    renderizarPagina({
      id: 'jugador-1',
      nombreCompleto: 'Jugador Uno',
      correo: 'jugador@mail.com',
      telefono: '3001234567',
      rol: 'jugador',
    });
    expect(screen.getByText('Pantalla Inicio Jugador')).toBeInTheDocument();
  });

  it('redirige a Gestión de torneos si el admin tiene debeCambiarContrasena=true', () => {
    renderizarPagina({
      ...ADMIN_AUTENTICADO,
      debeCambiarContrasena: true,
    });
    expect(screen.getByText('Pantalla Gestion Torneos')).toBeInTheDocument();
  });

  it('muestra el formulario de registro para un administrador válido', () => {
    renderizarPagina();
    expect(screen.getByRole('heading', { name: 'Registrar administrador' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument();
  });

  it('valida campos requeridos y formatos inválidos en el cliente', async () => {
    renderizarPagina();

    fireEvent.change(screen.getByLabelText(/Nombre completo/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'invalido' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '123' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrar administrador/i }));

    expect(await screen.findByText(/Ingresa tu nombre completo/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingresa un correo válido/i)).toBeInTheDocument();
    expect(screen.getByText(/Ingresa un teléfono válido/i)).toBeInTheDocument();
    expect(adminApi.registrarAdmin).not.toHaveBeenCalled();
  });

  it('crea el admin, limpia campos y abre el modal con la contraseña temporal (Escenario 1)', async () => {
    vi.mocked(adminApi.registrarAdmin).mockResolvedValueOnce({
      id: 'admin-nuevo-1',
      nombreCompleto: 'Laura Nueva',
      correo: 'laura.admin@unbosque.edu.co',
      telefono: '3109876543',
      rol: 'admin',
      contrasenaTemporal: 'Abc123Xyz987',
    });

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    renderizarPagina();

    fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
      target: { value: 'Laura Nueva' },
    });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'laura.admin@unbosque.edu.co' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '3109876543' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrar administrador/i }));

    expect(await screen.findByText('¡Administrador registrado!')).toBeInTheDocument();
    expect(screen.getByText('Abc123Xyz987')).toBeInTheDocument();

    // Copiar contraseña
    const btnCopiar = screen.getByRole('button', { name: /Copiar contraseña/i });
    fireEvent.click(btnCopiar);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Abc123Xyz987');
    await waitFor(() => {
      expect(screen.getByText('✓ ¡Copiada!')).toBeInTheDocument();
    });

    // Cerrar modal
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    expect(screen.queryByText('¡Administrador registrado!')).not.toBeInTheDocument();
  });

  it('muestra error de correo ya existente cuando la API responde CORREO_YA_ES_ADMIN (Escenario 4)', async () => {
    vi.mocked(adminApi.registrarAdmin).mockRejectedValueOnce(
      new ApiError(409, 'CORREO_YA_ES_ADMIN', 'Ya existe un administrador con ese correo'),
    );

    renderizarPagina();

    fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
      target: { value: 'Carlos Admin' },
    });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'carlos@unbosque.edu.co' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '3109876543' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrar administrador/i }));

    expect(
      await screen.findByText('Este correo ya pertenece a un administrador'),
    ).toBeInTheDocument();
  });

  it('abre diálogo de promoción si el correo es jugador y permite confirmar (Escenario 3)', async () => {
    vi.mocked(adminApi.registrarAdmin).mockRejectedValueOnce(
      new ApiError(409, 'CORREO_ES_JUGADOR', 'El correo pertenece a un jugador', {
        jugadorId: 'jugador-55',
        nombreJugador: 'Juan Pérez',
      }),
    );
    vi.mocked(adminApi.promoverJugador).mockResolvedValueOnce({
      id: 'jugador-55',
      nombreCompleto: 'Juan Pérez',
      correo: 'juan@unbosque.edu.co',
      telefono: '3151234567',
      rol: 'admin',
    });

    renderizarPagina();

    fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'juan@unbosque.edu.co' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '3151234567' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrar administrador/i }));

    expect(await screen.findByText('El correo pertenece a un jugador')).toBeInTheDocument();

    // Confirmar promoción
    fireEvent.click(screen.getByRole('button', { name: 'Promover a administrador' }));

    expect(adminApi.promoverJugador).toHaveBeenCalledWith('jugador-55');
    expect(
      await screen.findByText('¡El jugador Juan Pérez ha sido promovido a administrador!'),
    ).toBeInTheDocument();
  });

  it('muestra error si la promoción falla por torneo en curso (Escenario 3)', async () => {
    vi.mocked(adminApi.registrarAdmin).mockRejectedValueOnce(
      new ApiError(409, 'CORREO_ES_JUGADOR', 'El correo pertenece a un jugador', {
        jugadorId: 'jugador-55',
        nombreJugador: 'Juan Pérez',
      }),
    );
    vi.mocked(adminApi.promoverJugador).mockRejectedValueOnce(
      new ApiError(
        409,
        'JUGADOR_EN_TORNEO_EN_CURSO',
        'No se puede promover: participa en torneo en curso',
      ),
    );

    renderizarPagina();

    fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'juan@unbosque.edu.co' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '3151234567' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrar administrador/i }));

    expect(await screen.findByText('El correo pertenece a un jugador')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Promover a administrador' }));

    expect(
      await screen.findByText(/el jugador participa en un equipo con torneo en curso/i),
    ).toBeInTheDocument();
  });

  it('permite cancelar el diálogo de promoción', async () => {
    vi.mocked(adminApi.registrarAdmin).mockRejectedValueOnce(
      new ApiError(409, 'CORREO_ES_JUGADOR', 'El correo pertenece a un jugador', {
        jugadorId: 'jugador-55',
        nombreJugador: 'Juan Pérez',
      }),
    );

    renderizarPagina();

    fireEvent.change(screen.getByLabelText(/Nombre completo/i), {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'juan@unbosque.edu.co' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: '3151234567' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrar administrador/i }));

    expect(await screen.findByText('El correo pertenece a un jugador')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByText('El correo pertenece a un jugador')).not.toBeInTheDocument();
    expect(adminApi.promoverJugador).not.toHaveBeenCalled();
  });
});
