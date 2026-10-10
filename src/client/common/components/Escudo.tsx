import estilos from './Escudo.module.css';

/** Archivo en public/: Vite lo sirve tal cual desde la raíz. */
const RUTA_DEL_ESCUDO = '/escudo-liga-bosque.png';

interface PropiedadesEscudo {
  /** Lado en píxeles: el diseño usa 40, 42, 60, 116 y 172. */
  tamano: number;
  /** Texto alternativo. Vacío cuando el nombre «Liga Bosque» ya está escrito al lado. */
  textoAlternativo?: string;
  className?: string;
}

/** Escudo de Liga Bosque con sus colores originales (v3 · 00 · Marca y sistema). */
export function Escudo({ tamano, textoAlternativo = 'Liga Bosque', className }: PropiedadesEscudo) {
  return (
    <img
      src={RUTA_DEL_ESCUDO}
      alt={textoAlternativo}
      width={tamano}
      height={tamano}
      className={className ? `${estilos.escudo} ${className}` : estilos.escudo}
    />
  );
}

interface PropiedadesMarca {
  tamano?: 'mediana' | 'compacta';
}

/** Escudo y nombre en una fila: barra lateral, menú y panel de acceso. */
export function Marca({ tamano = 'compacta' }: PropiedadesMarca) {
  const esMediana = tamano === 'mediana';
  return (
    <div className={estilos.marca}>
      <Escudo tamano={esMediana ? 60 : 42} textoAlternativo="" />
      <span className={esMediana ? estilos.nombreMediano : estilos.nombreCompacto}>
        Liga Bosque
      </span>
    </div>
  );
}
