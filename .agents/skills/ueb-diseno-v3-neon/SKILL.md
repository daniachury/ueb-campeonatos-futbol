---
name: ueb-diseno-v3-neon
description: >-
  Especificaciones del sistema de diseño visual v3 (Neón Minimal · Liga Bosque Oficial Jira):
  paleta de color, tokens CSS de tema.css, CSS Modules, móvil primero y reglas críticas
  de React para evitar renders en cascada.
---

# Sistema de Diseño Visual v3 · Neón Minimal

Este documento establece las directrices de interfaz de usuario, arquitectura de estilos y patrones de renderizado para el frontend de **UEB Campeonatos de Fútbol**.

---

## 1. Identidad Visual: «Liga Bosque · Neón Minimal»

- **Lienzo de Referencia**: Liga Bosque · UI web y mobile (Página Oficial Jira).
- **Sensación Visual**: Deportivo moderno, sobrio, de alto contraste y limpio.
- **Enfoque Responsivo**: Móvil primero (tableros M de 360–767 px), centrado legible en tablet (768–1023 px) y ampliado en escritorio (1024 px y 1280+ px).

---

## 2. Tokens Globales (`src/client/styles/tema.css`)

Los componentes **nunca** deben declarar colores hexadecimales en bruto ni estilos inline ad-hoc. Deben consumir las variables CSS del sistema:

### Paleta de Superficies y Fondos
```css
--color-fondo-app: #f6f7f3;        /* Fondo general de la aplicación */
--color-campo: #f3f4f0;            /* Fondo de inputs, filtros y cajas secundarias */
--color-superficie: #ffffff;       /* Fondo de tarjetas, modales y tablas */
--color-tinte-acento: #f1fbd0;     /* Fondo sutil para chips de estado activo o badges */
--color-separador: #f0f2ec;        /* Líneas divisorias sutiles */
--color-borde-punteado: #d5d9cf;   /* Bordes estructurados */
```

### Paleta de Texto y Contraste
```css
--color-grafito: #161a14;          /* Texto principal de alto contraste y encabezados */
--color-texto-secundario: #6b7066; /* Subtítulos, etiquetas y metadatos secundarios */
--color-texto-apagado: #a3a89c;    /* Placeholders, hints e indicadores tenues */
```

### El Verde Neón (Regla de Oro de Uso)
```css
--color-acento: #b7f000;           /* Verde neón vibrante */
--color-acento-texto: #3f5200;     /* Oliva oscuro accesible para texto acentuado */
--color-avatar: #ff7a2f;           /* Naranja deportivo para avatares y destacados secundarios */
```

> [!WARNING]
> **REGLA DE ORO DEL VERDE NEÓN**:
> 1. Solo debe existir **UN solo elemento protagonista con `--color-acento` por pantalla** (ej. botón de acción principal o indicador de estado clave).
> 2. **NUNCA usar `--color-acento` como color de texto**, ya que sobre fondos claros no cumple el contraste mínimo de accesibilidad WCAG. Para texto destacado con acento verde, debe utilizarse exclusivamente `--color-acento-texto` (`#3f5200`).

### Radios y Geometría
```css
--radio-campo: 16px;      /* Inputs y campos de formulario */
--radio-tarjeta: 22px;    /* Tarjetas de equipo, partido o estadísticas */
--radio-seccion: 28px;    /* Contenedores de sección */
--radio-panel: 40px;      /* Paneles modales principales */
--radio-pildora: 999px;   /* Badges, tags y botones redondeados */
```

### Tipografía
```css
--fuente-principal: 'Plus Jakarta Sans', system-ui, sans-serif;
```

---

## 3. Patrones de Estilos con CSS Modules

- Todo componente en `src/client/` debe acompañarse de su archivo `[Componente].module.css`.
- Los selectores de clase deben reflejar el dominio (ej. `.tarjeta`, `.encabezado`, `.botonPrimario`).
- Evitar selectores anidados profundos; favorecer clases directas.
- Para elementos ocultos visualmente pero requeridos para lectores de pantalla, utilizar la clase global `.solo-lectores`.

---

## 4. Buenas Prácticas React 18: Prevención de Cascadas y Bucles

### Prohibido: `setState` síncrono en `useEffect`
La regla ESLint `react-hooks/set-state-in-effect` protege la aplicación contra re-renders innecesarios.

❌ **Incorrecto (dispara cascada de render)**:
```tsx
useEffect(() => {
  if (data) {
    setEquipos(data.equipos);
  }
}, [data]);
```

✅ **Correcto (estado derivado durante render)**:
```tsx
const equipos = useMemo(() => data?.equipos ?? [], [data]);
```

✅ **Correcto (en eventos o peticiones asíncronas)**:
```tsx
useEffect(() => {
  let activo = true;
  async function cargar() {
    const res = await api.obtenerEquipos();
    if (activo) setEquipos(res);
  }
  cargar();
  return () => { activo = false; };
}, [idTorneo]);
```

### Estabilidad de Dependencias con Sesión
El hook `useSesion()` retorna el estado del usuario. En pruebas con Vitest, el objeto usuario puede ser recreado en cada render:

❌ **Incorrecto (provoca re-ejecución infinita del efecto en tests)**:
```tsx
useEffect(() => {
  cargarDatos();
}, [usuarioActual]); // El objeto cambia de referencia cada render
```

✅ **Correcto (dependencia de valor primitivo estable)**:
```tsx
const usuarioId = usuarioActual?.id;
useEffect(() => {
  if (usuarioId) {
    cargarDatos(usuarioId);
  }
}, [usuarioId]);
```
