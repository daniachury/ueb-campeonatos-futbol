import { Boton } from '../../../common/components/Boton';
import estilos from './ModalConfirmarEliminar.module.css';

interface ModalConfirmarEliminarProps {
  estaAbierto: boolean;
  titulo: string;
  mensaje: string;
  estaCargando?: boolean;
  error?: string | null;
  alConfirmar: () => Promise<void>;
  alCerrar: () => void;
}

export function ModalConfirmarEliminar({
  estaAbierto,
  titulo,
  mensaje,
  estaCargando = false,
  error,
  alConfirmar,
  alCerrar,
}: ModalConfirmarEliminarProps) {
  if (!estaAbierto) return null;

  return (
    <div className={estilos.fondo} role="dialog" aria-modal="true">
      <div className={estilos.tarjeta}>
        <h2 className={estilos.titulo}>{titulo}</h2>
        <p className={estilos.mensaje}>{mensaje}</p>

        {error && <p className={estilos.error}>{error}</p>}

        <div className={estilos.pie}>
          <Boton
            tipo="button"
            variante="secundario"
            tamano="mediano"
            anchoCompleto={false}
            estaDeshabilitado={estaCargando}
            alPulsar={alCerrar}
          >
            Cancelar
          </Boton>
          <Boton
            tipo="button"
            variante="principal"
            tamano="mediano"
            anchoCompleto={false}
            estaCargando={estaCargando}
            alPulsar={() => void alConfirmar()}
          >
            Confirmar eliminación
          </Boton>
        </div>
      </div>
    </div>
  );
}
