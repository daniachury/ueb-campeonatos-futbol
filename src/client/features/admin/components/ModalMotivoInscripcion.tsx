import { useEffect, useState, type ChangeEvent } from 'react';
import { Boton } from '../../../common/components/Boton';
import { REGLAS } from '@shared/constants';
import estilos from './ModalMotivoInscripcion.module.css';

interface PropiedadesModalMotivo {
  estaAbierto: boolean;
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  estaCargando?: boolean;
  errorExterno?: string | null;
  alConfirmar: (motivo: string) => void;
  alCerrar: () => void;
}

export function ModalMotivoInscripcion({
  estaAbierto,
  titulo,
  descripcion,
  textoConfirmar = 'Confirmar',
  estaCargando = false,
  errorExterno = null,
  alConfirmar,
  alCerrar,
}: PropiedadesModalMotivo) {
  const [motivo, setMotivo] = useState('');
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    if (estaAbierto) {
      setMotivo('');
      setTocado(false);
    }
  }, [estaAbierto]);

  useEffect(() => {
    function manejarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape' && estaAbierto && !estaCargando) {
        alCerrar();
      }
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [estaAbierto, estaCargando, alCerrar]);

  if (!estaAbierto) return null;

  const longitud = motivo.trim().length;
  const esValido =
    longitud >= REGLAS.MOTIVO_RECHAZO_MIN && longitud <= REGLAS.MOTIVO_RECHAZO_MAX;

  const errorLocal =
    tocado && longitud > 0 && longitud < REGLAS.MOTIVO_RECHAZO_MIN
      ? `El motivo debe tener al menos ${REGLAS.MOTIVO_RECHAZO_MIN} caracteres (llevas ${longitud})`
      : tocado && longitud > REGLAS.MOTIVO_RECHAZO_MAX
        ? `El motivo supera el límite de ${REGLAS.MOTIVO_RECHAZO_MAX} caracteres`
        : null;

  function manejarCambio(e: ChangeEvent<HTMLTextAreaElement>) {
    setMotivo(e.target.value);
    if (!tocado) setTocado(true);
  }

  function enviar() {
    setTocado(true);
    if (esValido && !estaCargando) {
      alConfirmar(motivo.trim());
    }
  }

  return (
    <div
      className={estilos.fondo}
      onClick={(e) => {
        if (e.target === e.currentTarget && !estaCargando) alCerrar();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >
      <div className={estilos.tarjeta}>
        <h2 id="modal-titulo" className={estilos.titulo}>
          {titulo}
        </h2>
        <p className={estilos.descripcion}>{descripcion}</p>

        <textarea
          className={`${estilos.areaTexto} ${errorLocal || errorExterno ? estilos.areaTextoError : ''}`}
          placeholder="Escribe el motivo detallado aquí (entre 10 y 300 caracteres)..."
          value={motivo}
          onChange={manejarCambio}
          disabled={estaCargando}
          rows={4}
          autoFocus
        />

        <div className={estilos.filaInfo}>
          <span>Mínimo 10 caracteres</span>
          <span>
            {motivo.length}/{REGLAS.MOTIVO_RECHAZO_MAX}
          </span>
        </div>

        {(errorLocal || errorExterno) && (
          <div className={estilos.error} role="alert">
            {errorLocal || errorExterno}
          </div>
        )}

        <div className={estilos.acciones}>
          <Boton
            variante="secundario"
            tamano="mediano"
            anchoCompleto={false}
            estaDeshabilitado={estaCargando}
            alPulsar={alCerrar}
          >
            Cancelar
          </Boton>
          <Boton
            variante="principal"
            tamano="mediano"
            anchoCompleto={false}
            estaDeshabilitado={!esValido || estaCargando}
            estaCargando={estaCargando}
            alPulsar={enviar}
          >
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </div>
  );
}
