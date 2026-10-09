import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Limpia lo que haya renderizado React Testing Library entre pruebas.
// Solo aplica a las pruebas del frontend (las que corren con jsdom).
afterEach(async () => {
  if (typeof document === 'undefined') return;
  const { cleanup } = await import('@testing-library/react');
  cleanup();
});
