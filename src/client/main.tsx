import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { z } from 'zod';
import { rutas } from './app/rutas';
import { crearServiciosDeLaApp, ProveedorDeServicios } from './app/servicios';
import { ProveedorDeSesion } from './common/sesion/ProveedorDeSesion';
import './styles/global.css';
import './styles/tema.css';

// La CSP de public/_headers no permite `new Function`: zod valida sin compilar código.
z.config({ jitless: true });

const servicios = crearServiciosDeLaApp();
const raiz = document.getElementById('root');
if (!raiz) throw new Error('No se encontró el elemento #root en index.html');

createRoot(raiz).render(
  <StrictMode>
    <ProveedorDeServicios servicios={servicios}>
      <ProveedorDeSesion servicioDeSesion={servicios.servicioDeSesion}>
        <RouterProvider router={createBrowserRouter(rutas)} />
      </ProveedorDeSesion>
    </ProveedorDeServicios>
  </StrictMode>,
);
