import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icono, type NombreDeIcono } from '../../../common/components/Icono';
import { Marca } from '../../../common/components/Escudo';
import { RUTAS } from '../../../common/navegacion';
import estilos from './DisenoDeAcceso.module.css';

const BENEFICIOS_DE_LA_LIGA: ReadonlyArray<{ icono: NombreDeIcono; texto: string }> = [
  { icono: 'escudo', texto: 'Inscribe a tu equipo' },
  { icono: 'tabla', texto: 'Sigue la tabla fecha a fecha' },
  { icono: 'calendario', texto: 'Mira cuándo y dónde juegas' },
];

const PESTANAS_DE_ACCESO = [
  { id: 'iniciar', ruta: RUTAS.INICIAR_SESION, texto: 'Iniciar sesión' },
  { id: 'crear', ruta: RUTAS.CREAR_CUENTA, texto: 'Crear cuenta' },
] as const;

export type PestanaDeAcceso = (typeof PESTANAS_DE_ACCESO)[number]['id'];

interface PropiedadesDisenoDeAcceso {
  children: ReactNode;
  /** Fondo de la pantalla en móvil: neón en S01, blanco en M01 y M02. */
  fondoMovil: 'neon' | 'blanco';
  /** En escritorio (W03) muestra las pestañas con esta activa. */
  pestanaActiva?: PestanaDeAcceso;
}

/**
 * Marco de las pantallas de acceso (v3 · S01, M01, M02 y W03).
 * En móvil solo dibuja el fondo: cada pantalla trae su propio encabezado.
 * En escritorio agrega el panel neón de la liga a la izquierda y centra el contenido a la derecha.
 */
export function DisenoDeAcceso({ children, fondoMovil, pestanaActiva }: PropiedadesDisenoDeAcceso) {
  return (
    <div className={`${estilos.pantalla} ${estilos[fondoMovil]}`}>
      <section aria-label="Liga Bosque" className={estilos.panelDeLaLiga}>
        <Marca tamano="mediana" />
        <div className={estilos.mensajeDeLaLiga}>
          <p className={estilos.lema}>
            Juega.
            <br />
            Compite.
            <br />
            Vuelve por más.
          </p>
          <p className={estilos.descripcion}>
            Los torneos de fútbol 11 de la Universidad El Bosque: inscripciones, calendario y tabla
            en un solo lugar.
          </p>
        </div>
        <ul className={estilos.beneficios}>
          {BENEFICIOS_DE_LA_LIGA.map((beneficio) => (
            <li key={beneficio.texto} className={estilos.beneficio}>
              <Icono nombre={beneficio.icono} tamano={18} />
              {beneficio.texto}
            </li>
          ))}
        </ul>
      </section>

      <main className={estilos.contenido}>
        <div className={estilos.columna}>
          {pestanaActiva && (
            <nav aria-label="Acceso" className={estilos.pestanas}>
              {PESTANAS_DE_ACCESO.map((pestana) => (
                <Link
                  key={pestana.id}
                  to={pestana.ruta}
                  aria-current={pestana.id === pestanaActiva ? 'page' : undefined}
                  className={estilos.pestana}
                >
                  {pestana.texto}
                </Link>
              ))}
            </nav>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
