import { Icono } from './Icono';
import estilos from './AvisoFlotante.module.css';

interface PropiedadesAvisoFlotante {
  mensaje: string;
  alCerrar: () => void;
}

/** Confirmación grafito con el check neón y botón para cerrarla (v3 · M11 y W04). */
export function AvisoFlotante({ mensaje, alCerrar }: PropiedadesAvisoFlotante) {
  return (
    <div role="status" className={estilos.aviso}>
      <span className={estilos.marcaDeConfirmacion}>
        <Icono nombre="confirmar" tamano={16} />
      </span>
      <span className={estilos.mensaje}>{mensaje}</span>
      <button type="button" aria-label="Cerrar aviso" className={estilos.cerrar} onClick={alCerrar}>
        <Icono nombre="cerrar" tamano={18} />
      </button>
    </div>
  );
}
