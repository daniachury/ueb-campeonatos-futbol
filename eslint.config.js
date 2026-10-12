import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Hace cumplir las fronteras del monolito: cada capa solo importa lo que le corresponde.
const frontera = (mensaje, patrones) => ({
  'no-restricted-imports': ['error', { patterns: [{ group: patrones, message: mensaje }] }],
});

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'reports', '.wrangler', 'node_modules']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/client/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...frontera('El frontend no importa código del backend; lo común va en src/shared.', [
        '**/server/**',
      ]),
    },
  },
  {
    files: ['src/server/**/*.ts'],
    languageOptions: { globals: globals.serviceworker },
    rules: frontera('El backend no importa código del frontend; lo común va en src/shared.', [
      '**/client/**',
    ]),
  },
  {
    files: ['src/shared/**/*.ts'],
    rules: frontera('src/shared no depende del frontend ni del backend.', [
      '**/client/**',
      '**/server/**',
    ]),
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
]);
