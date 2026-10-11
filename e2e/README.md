# Pruebas e2e (Playwright)

Recorren la app como lo haría una persona, en Chromium, contra el Worker compilado desde la
rama actual y servido por `wrangler dev` (runtime workerd) con una base D1 nueva en
`.wrangler/e2e`. No tocan producción ni la base de desarrollo.

```bash
npm run test:e2e           # toda la suite (levanta el servidor solo)
npm run test:e2e:informe   # abre el informe HTML con videos y trazas
npm run test:e2e:video     # graba el recorrido completo en cámara lenta
```

## Arquitectura

Las dependencias van en un solo sentido; ESLint (`eslint.config.js`) hace cumplir las fronteras.

| Capa            | Carpeta            | Responsabilidad                                                                                     |
| --------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| Pruebas         | `pruebas/`         | Escenarios por historia (KAN-16 … KAN-33), con pasos _Dado / Cuando / Entonces_.                    |
| Fixtures        | `fixtures/`        | Raíz de composición: inyecta páginas, flujos, escenarios y el almacén en cada prueba.               |
| Flujos          | `flujos/`          | Tareas que cruzan pantallas, como iniciar sesión según el rol.                                      |
| Páginas         | `paginas/`         | _Page Objects_: acciones del negocio y elementos por rol accesible. Sin aserciones.                 |
| Dominio         | `dominio/`         | Modelos, _Builders_ (`unJugador()`, `unTorneo()`), escenarios y el puerto `AlmacenDeDatosDePrueba`. |
| Infraestructura | `infraestructura/` | Adaptador del puerto sobre la D1 local (API de `wrangler dev`) y el cifrado PBKDF2.                 |

Reglas:

- Las pruebas no importan código de `src/`: la app es una caja negra.
- Los datos de partida se preparan con `escenarios` (no por la interfaz): cada prueba ejercita
  en pantalla solo lo que verifica y se respeta el límite de 5 registros por minuto.
- Cada dato es único (sufijos aleatorios), así las pruebas corren en paralelo sin chocar.
- Un bug conocido se marca con `test.fail(true, 'motivo')`: la suite sigue en verde y avisa
  cuando el bug se corrige.
