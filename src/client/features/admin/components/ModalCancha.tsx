import { useState, type FormEvent } from 'react';
import { Boton } from '../../../common/components/Boton';
import {
  SUPERFICIES_CANCHA,
  type CanchaResumen,
  type SuperficieCancha,
} from '../../../../shared/sedes/contrato-sedes';
import estilos from './ModalCancha.module.css';

interface ModalCanchaProps {
  estaAbierto: boolean;
  sedeNombre: string;
  canchaEditar?: CanchaResumen | null;
  estaCargando?: boolean;
  errorExterno?: string | null;
  alGuardar: (datos: {
    nombre: string;
    superficie?: SuperficieCancha | null;
    activa: boolean;
  }) => Promise<void>;
  alCerrar: () => void;
}

export function ModalCancha({
  estaAbierto,
  sedeNombre,
  canchaEditar,
  estaCargando = false,
  errorExterno,
  alGuardar,
  alCerrar,
}: ModalCanchaProps) {
  const [nombre, setNombre] = useState('');
  const [superficie, setSuperficie] = useState<string>('');
  const [activa, setActiva] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const [estabaAbierto, setEstabaAbierto] = useState(estaAbierto);
  const [canchaAnterior, setCanchaAnterior] = useState(canchaEditar);

  if (estaAbierto !== estabaAbierto || canchaEditar !== canchaAnterior) {
    setEstabaAbierto(estaAbierto);
    setCanchaAnterior(canchaEditar);
    if (estaAbierto) {
      if (canchaEditar) {
        setNombre(canchaEditar.nombre);
        setSuperficie(canchaEditar.superficie ?? '');
        setActiva(canchaEditar.activa);
      } else {
        setNombre('');
        setSuperficie('');
        setActiva(true);
      }
      setErrorLocal(null);
    }
  }

  if (!estaAbierto) return null;

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorLocal(null);

    if (nombre.trim().length < 1 || nombre.trim().length > 30) {
      setErrorLocal('El nombre o número de cancha debe tener entre 1 y 30 caracteres');
      return;
    }

    try {
      await alGuardar({
        nombre: nombre.trim(),
        superficie: superficie ? (superficie as SuperficieCancha) : null,
        activa,
      });
    } catch (err: unknown) {
      setErrorLocal(err instanceof Error ? err.message : 'Error al guardar la cancha');
    }
  }

  const errorMostrar = errorExterno || errorLocal;

  return (
    <div className={estilos.fondo} role="dialog" aria-modal="true">
      <div className={estilos.tarjeta}>
        <div className={estilos.cabecera}>
          <h2 className={estilos.titulo}>
            {canchaEditar ? 'Editar Cancha' : `Agregar Cancha a ${sedeNombre}`}
          </h2>
        </div>

        <form onSubmit={manejarSubmit} className={estilos.formulario}>
          <div className={estilos.grupoCampo}>
            <label htmlFor="campo-nombre-cancha" className={estilos.etiqueta}>
              Nombre o número de cancha *
            </label>
            <input
              id="campo-nombre-cancha"
              className={estilos.campo}
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Cancha 1"
              required
            />
          </div>

          <div className={estilos.grupoCampo}>
            <label htmlFor="campo-superficie-cancha" className={estilos.etiqueta}>
              Superficie
            </label>
            <select
              id="campo-superficie-cancha"
              className={estilos.campo}
              value={superficie}
              onChange={(e) => setSuperficie(e.target.value)}
            >
              <option value="">(Sin especificar)</option>
              {SUPERFICIES_CANCHA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className={estilos.filaCheckbox}>
            <input
              id="campo-activa-cancha"
              className={estilos.checkbox}
              type="checkbox"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
            />
            <label htmlFor="campo-activa-cancha" className={estilos.etiqueta}>
              Cancha activa (disponible para partidos)
            </label>
          </div>

          {errorMostrar && <p className={estilos.error}>{errorMostrar}</p>}

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
              tipo="submit"
              variante="principal"
              tamano="mediano"
              anchoCompleto={false}
              estaCargando={estaCargando}
            >
              Guardar cancha
            </Boton>
          </div>
        </form>
      </div>
    </div>
  );
}
